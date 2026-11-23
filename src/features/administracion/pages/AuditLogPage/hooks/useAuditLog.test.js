import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUDIT_QUERY_ERROR, AUDIT_SOURCE_MODE } from '../../../types/auditSource.js';
import { AUDIT_LOG_ERROR_MESSAGE, useAuditLog } from './useAuditLog.js';

// React mínimo para entorno node: useState devuelve el estado inicial
// con un setter espía; useEffect se guarda para ejecutarlo.
const react = vi.hoisted(() => ({ setters: [], effects: [], state: {} }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const setter = vi.fn();
    const index = react.setters.length;
    react.setters.push(setter);
    return [react.state[index] ?? (typeof initial === 'function' ? initial() : initial), setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
}));

// Orden de los useState del hook.
const SET_ENTRIES = 1;
const SET_LOADING = 2;
const SET_ERROR = 3;
const SET_DENIED = 4;
const SET_ATTEMPT = 5;

const source = (mode, list = vi.fn()) => ({ getMode: () => mode, list });

const deniedError = () => Object.assign(new Error('x'), { code: AUDIT_QUERY_ERROR.ACCESS_DENIED });

async function loadWith(list, hook = useAuditLog) {
  const result = hook({ source: source(AUDIT_SOURCE_MODE.DEMO, list) });
  react.effects[0]();
  await vi.waitFor(() => expect(react.setters[SET_LOADING]).toHaveBeenLastCalledWith(false));
  return result;
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
  react.state = {};
});

describe('useAuditLog', () => {
  it('consulta el backend al iniciar y entrega una señal de cancelación', async () => {
    const list = vi.fn().mockResolvedValue({ records: [], nextCursor: null });
    useAuditLog({ source: source(AUDIT_SOURCE_MODE.API, list) });
    const cancel = react.effects[0]();
    const [{ cursor, signal }] = list.mock.calls[0];
    expect(cursor).toBeNull();
    cancel();
    expect(signal.aborted).toBe(true);
    await Promise.resolve();
  });

  it('anexa la página siguiente en el orden recibido', async () => {
    react.state[6] = 'siguiente';
    const list = vi.fn().mockResolvedValue({ records: [{ id: 'b' }], nextCursor: null });
    await loadWith(list);
    expect(list.mock.calls[0][0].cursor).toBe('siguiente');
    const [append] = react.setters[SET_ENTRIES].mock.lastCall;
    expect(append([{ id: 'a' }]).map(({ id }) => id)).toEqual(['a', 'b']);
  });

  it('borra los registros si la sesión expira', async () => {
    await loadWith(vi.fn().mockRejectedValue({ code: AUDIT_QUERY_ERROR.SESSION_EXPIRED }));
    expect(react.setters[8]).toHaveBeenLastCalledWith(true);
    expect(react.setters[SET_ENTRIES]).toHaveBeenLastCalledWith([]);
  });

  it('en demostración empieza cargando', () => {
    expect(useAuditLog({ source: source(AUDIT_SOURCE_MODE.DEMO) })).toMatchObject({ isDemo: true, isLoading: true, entries: [] });
  });

  it('presenta los registros en el orden recibido, solo con los campos permitidos', async () => {
    await loadWith(vi.fn().mockResolvedValue({ records: [
      { id: 'b', action: 'ACCESO_MODULO', resource: 'R', timestamp: '2026-01-02T00:00:00Z', status: 'EXITOSA', ipAddress: '192.0.2.1', userId: 'u' },
      { id: 'a', action: 'EXPORTACION_DATOS', resource: 'S', timestamp: '2026-01-01T00:00:00Z', status: 'FALLIDA', sessionId: 's' },
    ], nextCursor: null }));

    const [entries] = react.setters[SET_ENTRIES].mock.lastCall;
    expect(entries.map(({ id }) => id)).toEqual(['b', 'a']);
    for (const entry of entries) expect(Object.keys(entry).sort()).toEqual(['action', 'id', 'resource', 'status', 'timestamp']);
  });

  it('un acceso denegado se identifica por código, sin mensaje de error genérico', async () => {
    await loadWith(vi.fn().mockRejectedValue(deniedError()));

    expect(react.setters[SET_DENIED]).toHaveBeenLastCalledWith(true);
    expect(react.setters[SET_ERROR]).not.toHaveBeenCalledWith(AUDIT_LOG_ERROR_MESSAGE);
    expect(react.setters[SET_ENTRIES]).toHaveBeenLastCalledWith([]);
  });

  it('el texto del error no decide: un mensaje «denegado» sin código es un error genérico', async () => {
    await loadWith(vi.fn().mockRejectedValue(new Error('Acceso denegado')));

    expect(react.setters[SET_DENIED]).not.toHaveBeenCalledWith(true);
    expect(react.setters[SET_ERROR]).toHaveBeenLastCalledWith(AUDIT_LOG_ERROR_MESSAGE);
  });

  it('un fallo es un error, nunca registros de reemplazo', async () => {
    await loadWith(vi.fn().mockRejectedValue(new Error('x')));

    expect(react.setters[SET_ERROR]).toHaveBeenLastCalledWith(AUDIT_LOG_ERROR_MESSAGE);
    expect(react.setters[SET_ENTRIES]).toHaveBeenLastCalledWith([]);
  });

  it('una página sin registros se muestra vacía', async () => {
    await loadWith(vi.fn().mockResolvedValue({ records: [], nextCursor: null }));

    expect(react.setters[SET_ENTRIES]).toHaveBeenLastCalledWith([]);
  });

  it('ignora la respuesta si el componente ya se desmontó', async () => {
    let resolve;
    useAuditLog({ source: source(AUDIT_SOURCE_MODE.DEMO, () => new Promise((done) => { resolve = done; })) });

    const cleanup = react.effects[0]();
    cleanup();
    resolve({ records: [{ id: 'a' }], nextCursor: null });
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[SET_ENTRIES]).not.toHaveBeenCalled();
  });

  it('solo expone operaciones de consulta', () => {
    const result = useAuditLog({ source: source(AUDIT_SOURCE_MODE.DEMO) });

    expect(Object.keys(result).filter((key) => typeof result[key] === 'function')).toEqual(['retry', 'loadMore']);
    result.retry();
    expect(react.setters[SET_ATTEMPT]).toHaveBeenCalledTimes(1);
  });
});
