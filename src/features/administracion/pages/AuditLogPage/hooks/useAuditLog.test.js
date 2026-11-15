import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUDIT_QUERY_ERROR, AUDIT_SOURCE_MODE } from '../../../types/auditSource.js';
import { AUDIT_LOG_ERROR_MESSAGE, useAuditLog } from './useAuditLog.js';

// React mínimo para entorno node: useState devuelve el estado inicial
// con un setter espía; useEffect se guarda para ejecutarlo.
const react = vi.hoisted(() => ({ setters: [], effects: [] }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const setter = vi.fn();
    react.setters.push(setter);
    return [typeof initial === 'function' ? initial() : initial, setter];
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
});

describe('useAuditLog', () => {
  it('con la integración pendiente no consulta ninguna fuente', () => {
    const list = vi.fn();
    const result = useAuditLog({ source: source(AUDIT_SOURCE_MODE.PENDING_INTEGRATION, list) });

    expect(result).toMatchObject({ isIntegrationPending: true, isDemo: false, isLoading: false, isDenied: false });
    expect(react.effects[0]()).toBeUndefined();
    expect(list).not.toHaveBeenCalled();
  });

  it('en demostración empieza cargando', () => {
    expect(useAuditLog({ source: source(AUDIT_SOURCE_MODE.DEMO) })).toMatchObject({ isDemo: true, isLoading: true, entries: [] });
  });

  it('presenta los registros en el orden recibido, solo con los campos permitidos', async () => {
    await loadWith(vi.fn().mockResolvedValue([
      { id: 'b', action: 'ACCESO_MODULO', resource: 'R', timestamp: '2026-01-02T00:00:00Z', status: 'EXITOSA', ipAddress: '192.0.2.1', userId: 'u' },
      { id: 'a', action: 'EXPORTACION_DATOS', resource: 'S', timestamp: '2026-01-01T00:00:00Z', status: 'FALLIDA', sessionId: 's' },
    ]));

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

  it('una respuesta que no es lista se trata como vacía', async () => {
    await loadWith(vi.fn().mockResolvedValue(null));

    expect(react.setters[SET_ENTRIES]).toHaveBeenLastCalledWith([]);
  });

  it('ignora la respuesta si el componente ya se desmontó', async () => {
    let resolve;
    useAuditLog({ source: source(AUDIT_SOURCE_MODE.DEMO, () => new Promise((done) => { resolve = done; })) });

    const cleanup = react.effects[0]();
    cleanup();
    resolve([{ id: 'a' }]);
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[SET_ENTRIES]).not.toHaveBeenCalled();
  });

  it('solo expone consulta: reintentar es la única operación', () => {
    const result = useAuditLog({ source: source(AUDIT_SOURCE_MODE.DEMO) });

    expect(Object.keys(result).filter((key) => typeof result[key] === 'function')).toEqual(['retry']);
    result.retry();
    expect(react.setters[SET_ATTEMPT]).toHaveBeenCalledTimes(1);
  });
});
