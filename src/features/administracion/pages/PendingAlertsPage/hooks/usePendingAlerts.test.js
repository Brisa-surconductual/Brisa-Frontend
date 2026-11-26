import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import {
  PENDING_ALERTS_SOURCE_MODE,
  PENDING_ALERTS_STATUS as S,
} from '../../../types/pendingAlerts.js';

import { usePendingAlerts } from './usePendingAlerts.js';

/*
 * React mínimo para node (ADR-0002), como en las demás pruebas de hooks
 * del M08: cada useState/useRef es una celda por orden de llamada y los
 * efectos se ejecutan a mano.
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

// Orden de los efectos del hook: montaje, nombre de la cohorte, consulta.
const MOUNT_EFFECT = 0;
const LOAD_EFFECT = 2;
const COHORT = 'c0000000-0000-4000-8000-000000000001';
const OTHER = 'c0000000-0000-4000-8000-000000000002';
const id = (n) => `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const item = (n, changes = {}) => ({
  id_alerta: id(n),
  tipo_alerta: 'CRAVING_ELEVADO',
  fecha_generacion: '2026-11-12T22:15:00Z',
  codigo_participante: `P-0000000${n}`,
  ...changes,
});

const body = (items, changes = {}) => ({ items, total: items.length, offset: 0, limit: 20, ...changes });
const httpError = (status, codigo, mensaje = '') =>
  toApiError({ response: { status, data: { status, codigo, mensaje } } });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let source;

function render(args = {}, hook = usePendingAlerts) {
  react.index = 0;
  react.refIndex = 0;
  react.effects = [];
  return hook({ cohortId: COHORT, source, ...args });
}

// Monta y ejecuta la consulta; devuelve el resultado tras la respuesta.
async function load(args) {
  render(args);
  react.effects[MOUNT_EFFECT]();
  const cleanup = react.effects[LOAD_EFFECT]();
  await flush();
  return { cleanup, result: render(args) };
}

// Tras un cambio de dependencias (filtro, página, recarga) se vuelve a consultar.
async function reload() {
  render();
  react.effects[LOAD_EFFECT]();
  await flush();
  return render();
}

beforeEach(() => {
  react.cells = [];
  react.refs = [];
  source = {
    getMode: () => PENDING_ALERTS_SOURCE_MODE.API,
    getCohort: vi.fn(async (cohortId) => ({ id: cohortId, name: 'Cohorte Piloto' })),
    fetchPendingAlerts: vi.fn(async () => body([item(1), item(2)])),
    attendAlert: vi.fn(async (alertId) => ({ id_alerta: alertId, estado: 'ATENDIDA' })),
  };
});

describe('consulta de la bandeja (RF-146)', () => {
  it('200: lista transformada, total y paginación del servidor', async () => {
    const { result } = await load();

    expect(source.fetchPendingAlerts).toHaveBeenCalledWith(
      COHORT,
      { type: null, offset: 0, limit: 20 },
      { signal: expect.any(AbortSignal) },
    );
    expect(result.status).toBe(S.READY);
    expect(result.page.total).toBe(2);
    expect(result.page.items.map(({ participantCode }) => participantCode)).toEqual(['P-00000001', 'P-00000002']);
    expect(result.pagination).toMatchObject({ pageNumber: 1, pageCount: 1, canGoForward: false });
  });

  it('204: sin alertas pendientes, sin lista inventada', async () => {
    source.fetchPendingAlerts.mockResolvedValue(null);
    const { result } = await load();

    expect(result.status).toBe(S.EMPTY);
    expect(result.page).toBeNull();
  });

  it('el filtro se resuelve en el servidor y vuelve a la primera página', async () => {
    source.fetchPendingAlerts.mockResolvedValue(body([item(1)], { total: 45, offset: 0 }));
    const { result } = await load();

    result.goForward();
    await reload();
    expect(source.fetchPendingAlerts.mock.calls.at(-1)[1]).toEqual({ type: null, offset: 20, limit: 20 });

    render().changeFilter('INACTIVIDAD');
    await reload();
    expect(source.fetchPendingAlerts.mock.calls.at(-1)[1]).toEqual({ type: 'INACTIVIDAD', offset: 0, limit: 20 });
  });

  it('página fuera de rango: pide la última que existe, sin inventar datos', async () => {
    source.fetchPendingAlerts
      .mockResolvedValueOnce(body([item(1)], { total: 41, offset: 0 }))
      .mockResolvedValueOnce(body([], { total: 21, offset: 40 }))
      .mockResolvedValueOnce(body([item(21)], { total: 21, offset: 20 }));
    const { result } = await load();

    result.goForward();
    react.cells[1] = { type: null, offset: 40 };
    const outOfRange = await reload();
    expect(outOfRange.status).toBe(S.LOADING);
    expect(react.cells[1].offset).toBe(20);

    const valid = await reload();
    expect(valid.status).toBe(S.READY);
    expect(valid.page.items).toHaveLength(1);
  });

  it.each([
    [httpError(404, 'COHORTE_NO_ENCONTRADA', 'La cohorte solicitada no existe en el sistema.'), S.COHORT_NOT_FOUND, false],
    [httpError(400, 'X'), S.INVALID_REQUEST, false],
    [httpError(403, 'ACCESO_DENEGADO'), S.DENIED, false],
    [httpError(401, undefined), S.UNAUTHENTICATED, false],
    [httpError(500, 'ERROR_TRANSACCION'), S.SERVER_ERROR, true],
    [toApiError(new Error('Network Error')), S.CONNECTION_ERROR, true],
  ])('error %#: estado propio y nunca una lista vacía', async (error, status, canRetry) => {
    source.fetchPendingAlerts.mockRejectedValue(error);
    const { result } = await load();

    expect(result).toMatchObject({ status, canRetry, page: null });
  });

  it('503 M05_NO_DISPONIBLE: reintento por acción del usuario', async () => {
    source.fetchPendingAlerts
      .mockRejectedValueOnce(httpError(503, 'M05_NO_DISPONIBLE', 'El módulo de seguimiento no se encuentra disponible en este momento.'))
      .mockResolvedValueOnce(body([item(1)]));
    const { result } = await load();

    expect(result).toMatchObject({ status: S.SOURCE_UNAVAILABLE, canRetry: true });
    expect(result.message).toMatch(/no se encuentra disponible/);

    result.retry();
    expect((await reload()).status).toBe(S.READY);
    expect(source.fetchPendingAlerts).toHaveBeenCalledTimes(2);
  });

  it('respuesta tardía de una consulta anterior: se descarta y la consulta se cancela', async () => {
    let resolveLate;
    source.fetchPendingAlerts.mockReturnValue(new Promise((resolve) => { resolveLate = resolve; }));
    render();
    react.effects[MOUNT_EFFECT]();
    const cleanup = react.effects[LOAD_EFFECT]();
    const { signal } = source.fetchPendingAlerts.mock.calls[0][2];

    cleanup();
    resolveLate(body([item(9)]));
    await flush();

    expect(signal.aborted).toBe(true);
    expect(render().status).toBe(S.LOADING);
  });

  it('el nombre de otra cohorte nunca se muestra', async () => {
    source.getCohort.mockResolvedValue({ id: OTHER, name: 'Otra cohorte' });
    render();
    react.effects[1]();
    await flush();

    expect(render().cohort).toBeNull();
  });

  it('modo de demostración: no consulta ni escribe en el servidor', async () => {
    source.getMode = () => PENDING_ALERTS_SOURCE_MODE.DEMO_UNAVAILABLE;
    const result = render();

    expect(result.status).toBe(S.DEMO_UNAVAILABLE);
    expect(result.isDemo).toBe(true);
    expect(react.effects[LOAD_EFFECT]()).toBeUndefined();
    result.openAttend({ id: id(1), participantCode: 'P-00000001' });
    expect(render().dialog).toBeNull();
    expect(source.fetchPendingAlerts).not.toHaveBeenCalled();
    expect(source.attendAlert).not.toHaveBeenCalled();
  });
});

describe('marcar como atendida (RF-147)', () => {
  async function openDialog() {
    const { result } = await load();
    result.openAttend(result.page.items[0]);
    return render();
  }

  it('abrir el diálogo no envía nada; cancelar lo cierra sin POST', async () => {
    const opened = await openDialog();

    expect(opened.dialog).toMatchObject({ reason: '', submitting: false });
    expect(opened.dialog.alert.participantCode).toBe('P-00000001');
    opened.cancelAttend();
    expect(render().dialog).toBeNull();
    expect(source.attendAlert).not.toHaveBeenCalled();
  });

  it('motivo obligatorio de 10 a 500 caracteres: sin POST si no es válido', async () => {
    const opened = await openDialog();

    opened.changeReason('   corto   ');
    render().confirmAttend();
    await flush();

    expect(render().dialog.reasonError).toBe('El motivo debe tener al menos 10 caracteres.');
    expect(source.attendAlert).not.toHaveBeenCalled();
  });

  it('confirmar envía el id de la alerta y el motivo recortado; bloquea el doble envío', async () => {
    let resolvePost;
    source.attendAlert.mockReturnValue(new Promise((resolve) => { resolvePost = resolve; }));
    const opened = await openDialog();

    opened.changeReason('  Se contactó al participante y se agendó sesión.  ');
    const ready = render();
    ready.confirmAttend();
    ready.confirmAttend();

    const processing = render();
    expect(source.attendAlert).toHaveBeenCalledTimes(1);
    expect(source.attendAlert).toHaveBeenCalledWith(id(1), 'Se contactó al participante y se agendó sesión.');
    expect(processing.dialog.submitting).toBe(true);
    expect(processing.busy).toBe(true);
    // No se puede cerrar antes de conocer el resultado.
    processing.cancelAttend();
    expect(render().dialog).not.toBeNull();
    // La lista no cambia de forma optimista.
    expect(processing.page.items).toHaveLength(2);

    resolvePost({ estado: 'ATENDIDA' });
    await flush();
    const done = render();
    expect(done.dialog).toBeNull();
    expect(done.notice).toEqual({ tone: 'success', text: 'La alerta de P-00000001 quedó registrada como atendida.' });
    expect(react.cells[2]).toBe(1);
  });

  it('tras el éxito se vuelve a consultar al servidor', async () => {
    const opened = await openDialog();
    opened.changeReason('Se contactó al participante.');
    render().confirmAttend();
    await flush();

    source.fetchPendingAlerts.mockResolvedValue(body([item(2)]));
    const refreshed = await reload();

    expect(source.fetchPendingAlerts).toHaveBeenCalledTimes(2);
    expect(refreshed.page.items.map(({ id: alertId }) => alertId)).toEqual([id(2)]);
  });

  async function confirmWith(error) {
    source.attendAlert.mockRejectedValue(error);
    const opened = await openDialog();
    opened.changeReason('Se contactó al participante.');
    render().confirmAttend();
    await flush();
    return render();
  }

  it.each([
    ['409 ALERTA_YA_ATENDIDA', httpError(409, 'ALERTA_YA_ATENDIDA')],
    ['409 ALERTA_NO_ACTIVA', httpError(409, 'ALERTA_NO_ACTIVA')],
    ['404 ALERTA_NO_ENCONTRADA', httpError(404, 'ALERTA_NO_ENCONTRADA')],
  ])('%s: informa, cierra el diálogo y actualiza la bandeja', async (_, error) => {
    const result = await confirmWith(error);

    expect(result.dialog).toBeNull();
    expect(result.notice.tone).toBe('info');
    expect(react.cells[2]).toBe(1);
    expect(result.requiresRefresh).toBe(false);
  });

  it('422 MOTIVO_INVALIDO: conserva el motivo escrito para corregirlo', async () => {
    const result = await confirmWith(httpError(422, 'MOTIVO_INVALIDO', 'El motivo es obligatorio y debe tener entre 10 y 500 caracteres.'));

    expect(result.dialog).toMatchObject({
      reason: 'Se contactó al participante.',
      submitting: false,
      reasonError: 'El motivo es obligatorio y debe tener entre 10 y 500 caracteres.',
    });
  });

  it('503: el diálogo sigue abierto y la alerta no cambia', async () => {
    const result = await confirmWith(httpError(503, 'M05_NO_DISPONIBLE'));

    expect(result.dialog.error).toMatch(/no está disponible/);
    expect(result.page.items).toHaveLength(2);
    expect(react.cells[2]).toBe(0);
  });

  it.each([
    ['500 ERROR_TRANSACCION', httpError(500, 'ERROR_TRANSACCION', 'No fue posible registrar la acción. La alerta conserva su estado.')],
    ['sin conexión', toApiError(new Error('Network Error'))],
  ])('%s: sin éxito ficticio; hay que actualizar antes de reintentar', async (_, error) => {
    const result = await confirmWith(error);

    expect(result.dialog).toBeNull();
    expect(result.notice.tone).toBe('danger');
    expect(result.notice.text).not.toMatch(/registrada como atendida\.$/);
    expect(result.requiresRefresh).toBe(true);
    expect(result.page.items).toHaveLength(2);

    result.openAttend(result.page.items[0]);
    expect(render().dialog).toBeNull();

    result.refresh();
    const refreshed = await reload();
    expect(refreshed.requiresRefresh).toBe(false);
  });

  it('401 al atender: pide iniciar sesión', async () => {
    const result = await confirmWith(httpError(401, undefined));

    expect(result.status).toBe(S.UNAUTHENTICATED);
  });
});
