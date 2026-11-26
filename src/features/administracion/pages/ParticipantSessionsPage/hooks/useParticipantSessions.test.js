import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { TRACE_QUERY_STATUS as S } from '../../../types/chatTraceability.js';

import { useParticipantSessions } from './useParticipantSessions.js';

/*
 * React mínimo para entorno node que conserva el estado entre renders:
 * cada useState es una celda por orden de llamada; los efectos se guardan
 * para ejecutarlos a mano.
 */
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
const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;

const item = (n, changes = {}) => ({
  id_sesion: id(n),
  modalidad: 'GRUPAL',
  estado: 'COMPLETADA',
  fecha_inicio: '2026-11-20T14:00:00.000Z',
  fecha_ultima_interaccion: '2026-11-20T14:20:00.000Z',
  ...changes,
});

const page = (items, changes = {}) => ({
  id_participante: CODE,
  items,
  total: items.length,
  siguiente_cursor: null,
  ...changes,
});

const httpError = (status, data = {}) => toApiError({ response: { status, data } });

// El hook llega como argumento, como en las demás pruebas de hooks del M08.
function render(args, hook = useParticipantSessions) {
  react.index = 0;
  react.refIndex = 0;
  react.effects = [];
  return hook(args);
}

function reset() {
  react.cells = [];
  react.refs = [];
}

async function loadWith(fetchSessions, participantCode = CODE) {
  const source = { fetchSessions };
  render({ participantCode, source });
  const cleanup = react.effects[LOAD_EFFECT]();
  await vi.waitFor(() => expect(react.cells[0].status).not.toBe(S.LOADING));
  return { source, cleanup, result: render({ participantCode, source }) };
}

beforeEach(reset);

describe('useParticipantSessions (RF-38)', () => {
  it('con un código que no es A7 no consulta nada', () => {
    const fetchSessions = vi.fn();
    const result = render({ participantCode: 'seg-0001', source: { fetchSessions } });

    expect(result.status).toBe(S.INVALID_ROUTE);
    expect(react.effects[LOAD_EFFECT]()).toBeUndefined();
    expect(fetchSessions).not.toHaveBeenCalled();
  });

  it('pide la primera página con el código normalizado y el límite, sin cursor', async () => {
    const fetchSessions = vi.fn().mockResolvedValue(page([item(1, { modalidad: 'SOS' })]));
    const { result } = await loadWith(fetchSessions, 'p-1a2b3c4d');

    const [code, options] = fetchSessions.mock.calls[0];
    expect(code).toBe(CODE);
    expect(options).toMatchObject({ limit: 20 });
    expect(options.cursor).toBeUndefined();
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(result.status).toBe(S.READY);
    expect(result.page.sessions.map((s) => s.modality)).toEqual(['SOS']);
  });

  it('participante sin sesiones', async () => {
    const { result } = await loadWith(vi.fn().mockResolvedValue(page([])));

    expect(result.status).toBe(S.READY);
    expect(result.page.sessions).toEqual([]);
  });

  it.each([
    [httpError(401, { codigo: 'NO_AUTENTICADO' }), S.UNAUTHENTICATED],
    [httpError(403, { codigo: 'NO_AUTORIZADO' }), S.DENIED],
    [httpError(404, { codigo: 'PARTICIPANTE_NO_ENCONTRADO' }), S.PARTICIPANT_NOT_FOUND],
    [httpError(400, { codigo: 'PARAMETRO_INVALIDO' }), S.INVALID_REQUEST],
    [httpError(500, {}), S.SERVER_ERROR],
    [toApiError(new Error('Network Error')), S.CONNECTION_ERROR],
  ])('%#: el error no deja datos', async (error, status) => {
    const { result } = await loadWith(vi.fn().mockRejectedValue(error));

    expect(result.status).toBe(status);
    expect(result.page).toBeNull();
  });

  it('respuesta de otro participante: MISMATCH, sin datos', async () => {
    const { result } = await loadWith(vi.fn().mockResolvedValue(page([item(1)], { id_participante: 'P-FFFFFFFF' })));

    expect(result.status).toBe(S.MISMATCH);
    expect(result.page).toBeNull();
  });

  it('cambio rápido de participante: cancela y descarta la respuesta tardía', async () => {
    let resolve;
    const fetchSessions = vi.fn(() => new Promise((r) => { resolve = r; }));
    render({ participantCode: CODE, source: { fetchSessions } });
    const cleanup = react.effects[LOAD_EFFECT]();
    const { signal } = fetchSessions.mock.calls[0][1];

    cleanup();
    resolve(page([item(1)]));
    await Promise.resolve();
    await Promise.resolve();

    expect(signal.aborted).toBe(true);
    expect(react.cells[0].status).toBe(S.LOADING);
    expect(react.cells[0].page).toBeNull();
  });

  it('carga la página siguiente enviando el cursor tal cual y se detiene en la última', async () => {
    const cursor = 'eyJmIjoiMjAyNi0xMS0yMFQxNDoyMDowMC4xMjM0NTZaIn0';
    const fetchSessions = vi
      .fn()
      .mockResolvedValueOnce(page([item(1)], { total: 2, siguiente_cursor: cursor }))
      .mockResolvedValueOnce(page([item(2)], { total: 2 }));
    const { result, source } = await loadWith(fetchSessions);

    await result.loadMore();
    const after = render({ participantCode: CODE, source });

    expect(fetchSessions.mock.calls[1][1]).toMatchObject({ limit: 20, cursor });
    expect(after.page.sessions.map((s) => s.id)).toEqual([id(1), id(2)]);
    expect(after.page.total).toBe(2);
    expect(after.page.nextCursor).toBeNull();

    await after.loadMore();
    expect(fetchSessions).toHaveBeenCalledTimes(2);
  });

  it('un error al cargar más conserva lo mostrado y permite reintentar', async () => {
    const fetchSessions = vi
      .fn()
      .mockResolvedValueOnce(page([item(1)], { total: 2, siguiente_cursor: 'c1' }))
      .mockRejectedValueOnce(httpError(500, {}));
    const { result, source } = await loadWith(fetchSessions);

    await result.loadMore();
    const after = render({ participantCode: CODE, source });

    expect(after.page.sessions).toHaveLength(1);
    expect(after.loadMoreError).toMatchObject({ status: S.SERVER_ERROR, canRetry: true });
    expect(after.isLoadingMore).toBe(false);
  });

  it('un 403 al cargar más bloquea también lo ya mostrado', async () => {
    const fetchSessions = vi
      .fn()
      .mockResolvedValueOnce(page([item(1)], { total: 2, siguiente_cursor: 'c1' }))
      .mockRejectedValueOnce(httpError(403, { codigo: 'NO_AUTORIZADO' }));
    const { result, source } = await loadWith(fetchSessions);

    await result.loadMore();
    const after = render({ participantCode: CODE, source });

    expect(after.status).toBe(S.DENIED);
    expect(after.page).toBeNull();
  });

  it('una sesión repetida en la página siguiente se descarta', async () => {
    const fetchSessions = vi
      .fn()
      .mockResolvedValueOnce(page([item(1)], { total: 2, siguiente_cursor: 'c1' }))
      .mockResolvedValueOnce(page([item(1)], { total: 2 }));
    const { result, source } = await loadWith(fetchSessions);

    await result.loadMore();
    const after = render({ participantCode: CODE, source });

    expect(after.page.sessions).toHaveLength(1);
    expect(after.loadMoreError.status).toBe(S.INVALID_RESPONSE);
  });

  it('reintentar es una acción del usuario: cambia el intento y vuelve a consultar', async () => {
    const fetchSessions = vi.fn().mockRejectedValueOnce(httpError(500, {})).mockResolvedValueOnce(page([item(1)]));
    const { result, source } = await loadWith(fetchSessions);
    expect(fetchSessions).toHaveBeenCalledTimes(1);

    result.retry();
    render({ participantCode: CODE, source });
    react.effects[LOAD_EFFECT]();
    await vi.waitFor(() => expect(react.cells[0].status).toBe(S.READY));

    expect(fetchSessions).toHaveBeenCalledTimes(2);
  });
});
