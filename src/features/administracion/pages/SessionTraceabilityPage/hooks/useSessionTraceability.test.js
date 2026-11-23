import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { TRACE_QUERY_STATUS as S } from '../../../types/chatTraceability.js';

import { useSessionTraceability } from './useSessionTraceability.js';

// React mínimo para entorno node que conserva el estado entre renders.
const react = vi.hoisted(() => ({ cells: [], refs: [], effects: [], index: 0, refIndex: 0 }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const i = react.index++;
    if (!(i in react.cells)) react.cells[i] = typeof initial === 'function' ? initial() : initial;
    return [
      react.cells[i],
      (update) => {
        react.cells[i] = typeof update === 'function' ? update(react.cells[i]) : update;
      },
    ];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
  useRef(initial) {
    const i = react.refIndex++;
    if (!(i in react.refs)) react.refs[i] = { current: initial };
    return react.refs[i];
  },
}));

const LOAD_EFFECT = 1;
const CODE = 'P-1A2B3C4D';
const SESSION = '00000000-0000-4000-8000-000000000001';

const record = (secuencia, changes = {}) => ({
  secuencia,
  id_nodo: '00000000-0000-4000-8000-00000000000a',
  respuesta_usuario: { valor: 'si' },
  id_nodo_destino: null,
  timestamp_interaccion: '2026-11-20T14:00:00.000Z',
  tipo_entrada: 'OPCION_UNICA',
  contenido_historico: 'VERIFICADO',
  motivo_no_verificable: null,
  tipo_nodo: 'PREGUNTA',
  texto_nodo: '¿Dormiste bien?',
  etiqueta_respuesta: 'Sí, bien',
  ...changes,
});

const trace = (registros, changes = {}) => ({
  id_sesion: SESSION,
  id_participante: CODE,
  registros,
  ...changes,
});

const httpError = (status, data = {}) => toApiError({ response: { status, data } });

// El hook llega como argumento, como en las demás pruebas de hooks del M08.
function render(args, hook = useSessionTraceability) {
  react.index = 0;
  react.refIndex = 0;
  react.effects = [];
  return hook(args);
}

async function loadWith(fetchTrace, args = {}) {
  const source = { fetchTrace };
  const request = { participantCode: CODE, sessionId: SESSION, source, ...args };
  render(request);
  react.effects[LOAD_EFFECT]();
  await vi.waitFor(() => expect(react.cells[0].status).not.toBe(S.LOADING));
  return render(request);
}

beforeEach(() => {
  react.cells = [];
  react.refs = [];
});

describe('useSessionTraceability (RF-38)', () => {
  it.each([
    ['código no A7', { participantCode: 'seg-0001' }],
    ['sesión no UUID', { sessionId: 'no-es-uuid' }],
  ])('%s: no consulta nada', (_, changes) => {
    const fetchTrace = vi.fn();
    const result = render({ participantCode: CODE, sessionId: SESSION, source: { fetchTrace }, ...changes });

    expect(result.status).toBe(S.INVALID_ROUTE);
    expect(react.effects[LOAD_EFFECT]()).toBeUndefined();
    expect(fetchTrace).not.toHaveBeenCalled();
  });

  it('envía la sesión y el código del participante, y ordena por secuencia', async () => {
    const fetchTrace = vi.fn().mockResolvedValue(trace([record(2), record(1)]));
    const result = await loadWith(fetchTrace, { participantCode: 'p-1a2b3c4d', sessionId: SESSION.toUpperCase() });

    expect(fetchTrace.mock.calls[0][0]).toBe(SESSION);
    expect(fetchTrace.mock.calls[0][1]).toBe(CODE);
    expect(result.status).toBe(S.READY);
    expect(result.trace.records.map((r) => r.sequence)).toEqual([1, 2]);
  });

  it('sin interacciones', async () => {
    const result = await loadWith(vi.fn().mockResolvedValue(trace([])));

    expect(result.status).toBe(S.READY);
    expect(result.trace.records).toEqual([]);
  });

  it.each([
    [httpError(422, { codigo: 'HISTORIAL_INCONSISTENTE' }), S.INCONSISTENT_HISTORY],
    [httpError(404, { codigo: 'SESION_NO_ENCONTRADA' }), S.SESSION_NOT_FOUND],
    [httpError(403, { codigo: 'NO_AUTORIZADO' }), S.DENIED],
    [httpError(401, { codigo: 'NO_AUTENTICADO' }), S.UNAUTHENTICATED],
    [httpError(500, {}), S.SERVER_ERROR],
  ])('%#: el error no deja registros parciales', async (error, status) => {
    const result = await loadWith(vi.fn().mockRejectedValue(error));

    expect(result.status).toBe(status);
    expect(result.trace).toBeNull();
  });

  it('respuesta de otro participante: no muestra ningún registro', async () => {
    const result = await loadWith(vi.fn().mockResolvedValue(trace([record(1)], { id_participante: 'P-FFFFFFFF' })));

    expect(result.status).toBe(S.MISMATCH);
    expect(result.trace).toBeNull();
  });

  it('datos inconsistentes: INVALID_RESPONSE, sin registros', async () => {
    const result = await loadWith(vi.fn().mockResolvedValue(trace([record(1), record(1)])));

    expect(result.status).toBe(S.INVALID_RESPONSE);
    expect(result.trace).toBeNull();
  });

  it('cambio de sesión antes de la respuesta: cancela y la descarta', async () => {
    let resolve;
    const fetchTrace = vi.fn(() => new Promise((r) => { resolve = r; }));
    render({ participantCode: CODE, sessionId: SESSION, source: { fetchTrace } });
    const cleanup = react.effects[LOAD_EFFECT]();
    const { signal } = fetchTrace.mock.calls[0][2];

    cleanup();
    resolve(trace([record(1)]));
    await Promise.resolve();
    await Promise.resolve();

    expect(signal.aborted).toBe(true);
    expect(react.cells[0].trace).toBeNull();
  });
});
