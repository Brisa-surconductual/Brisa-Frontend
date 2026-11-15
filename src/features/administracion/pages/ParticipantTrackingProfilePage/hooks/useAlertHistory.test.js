import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ALERT_HISTORY_STATUS, TRACKING_ACCESS } from '../../../types/participantTracking.js';
import { useAlertHistory } from './useAlertHistory.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * (o el fijado en `react.preset` por posición) con un setter espía;
 * useEffect se guarda para ejecutarlo.
 */
const react = vi.hoisted(() => ({ setters: [], effects: [], preset: {} }));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const position = react.setters.length;
    const setter = vi.fn();
    react.setters.push(setter);
    if (position in react.preset) return [react.preset[position], setter];
    return [typeof initial === 'function' ? initial() : initial, setter];
  },
  useEffect(effect) {
    react.effects.push(effect);
  },
}));

// Orden de los useState del hook.
const ALERTS = 0;
const STATUS = 1;
const LOADING = 2;
const ATTEMPT = 3;

const ALERT = Object.freeze({ type: 'CRAVING_ELEVADO', generatedAt: '2026-03-07T21:15:00-05:00' });

const granted = (changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  reference: 'ref-1',
  alerts: [
    { reference: 'ref-1', ...ALERT, source: 'RF-63', status: 'ACTIVA', resolvedAt: null, alertId: 'uuid-interno', notes: 'x@example.com' },
    { reference: 'ref-1', type: 'INACTIVIDAD', source: 'RF-68', generatedAt: '2026-02-01T10:00:00Z', status: 'RESUELTA', resolvedAt: '2026-02-02T10:00:00Z' },
  ],
  ...changes,
});

const source = (getHistory = vi.fn().mockResolvedValue(granted())) => ({ getHistory });

function render(args = {}, hook = useAlertHistory) {
  react.setters = [];
  react.effects = [];
  return hook({ cohortId: 'c-1', reference: 'ref-1', enabled: true, ...args });
}

async function loadWith(src) {
  render({ source: src });
  react.effects[0]();
  await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.setters = [];
  react.effects = [];
  react.preset = {};
});

describe('useAlertHistory', () => {
  it('sin habilitar (ficha denegada, con error o cargando) no consulta ni expone nada', () => {
    const src = source();
    const result = render({ enabled: false, source: src });

    expect(react.effects[0]()).toBeUndefined();
    expect(src.getHistory).not.toHaveBeenCalled();
    expect(result).toMatchObject({ alerts: null, status: null, isLoading: false, hasSummaryMismatch: false });
  });

  it('al deshabilitarse oculta un resultado anterior', () => {
    react.preset = { [ALERTS]: [{ ...ALERT, status: 'ACTIVA' }], [STATUS]: ALERT_HISTORY_STATUS.READY };

    expect(render({ enabled: false, source: source() })).toMatchObject({ alerts: null, status: null });
    expect(render({ enabled: true, source: source() }).alerts).toHaveLength(1);
  });

  it('habilitado: pide la cohorte y la referencia de la ruta, y cuenta como cargando hasta tener resultado', async () => {
    const src = source();

    expect(render({ source: src }).isLoading).toBe(true);
    await loadWith(src);
    expect(src.getHistory).toHaveBeenCalledWith('c-1', 'ref-1');
  });

  it('autorizado: guarda solo los campos permitidos, en orden cronológico', async () => {
    await loadWith(source());

    expect(lastValue(STATUS)).toBe(ALERT_HISTORY_STATUS.READY);
    expect(lastValue(ALERTS).map(({ status }) => status)).toEqual(['RESUELTA', 'ACTIVA']);
    expect(Object.keys(lastValue(ALERTS)[0]).sort()).toEqual(['generatedAt', 'resolvedAt', 'source', 'status', 'type']);
    expect(JSON.stringify(lastValue(ALERTS))).not.toMatch(/uuid|@/);
  });

  it.each([
    ['sin alertas (204)', { alerts: [] }, ALERT_HISTORY_STATUS.EMPTY],
    ['DENEGADO', { access: TRACKING_ACCESS.DENIED }, ALERT_HISTORY_STATUS.DENIED],
    ['sin campo de acceso', { access: undefined }, ALERT_HISTORY_STATUS.DENIED],
    ['otra referencia', { reference: 'ref-2' }, ALERT_HISTORY_STATUS.INCONSISTENT],
    ['otra cohorte', { cohortId: 'c-2' }, ALERT_HISTORY_STATUS.INCONSISTENT],
    ['una alerta ajena', { alerts: [{ reference: 'ref-2', ...ALERT }] }, ALERT_HISTORY_STATUS.INCONSISTENT],
    ['lista con forma inválida', { alerts: 'x' }, ALERT_HISTORY_STATUS.ERROR],
  ])('%s: sin registros', async (_, changes, status) => {
    await loadWith(source(vi.fn().mockResolvedValue(granted(changes))));

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(ALERTS)).toBeNull();
  });

  it.each([
    ['ACCESO_DENEGADO', ALERT_HISTORY_STATUS.DENIED],
    ['PARTICIPANTE_NO_ENCONTRADO', ALERT_HISTORY_STATUS.NOT_FOUND],
    ['COHORTE_NO_ENCONTRADA', ALERT_HISTORY_STATUS.COHORT_NOT_FOUND],
    ['PARTICIPANTE_FUERA_DE_COHORTE', ALERT_HISTORY_STATUS.OUTSIDE_COHORT],
    ['MODULO_NO_DISPONIBLE', ALERT_HISTORY_STATUS.UNAVAILABLE],
    [undefined, ALERT_HISTORY_STATUS.ERROR],
    ['OTRO_CODIGO', ALERT_HISTORY_STATUS.ERROR],
  ])('rechazo con código %s', async (code, status) => {
    await loadWith(source(vi.fn().mockRejectedValue(Object.assign(new Error('x'), { code }))));

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(ALERTS)).toBeNull();
  });

  it('el texto del error no decide: «no disponible» sin código es un error genérico', async () => {
    await loadWith(source(vi.fn().mockRejectedValue(new Error('El módulo de seguimiento no se encuentra disponible'))));

    expect(lastValue(STATUS)).toBe(ALERT_HISTORY_STATUS.ERROR);
  });

  it('ignora la respuesta si la ficha ya se desmontó', async () => {
    let resolve;
    render({ source: source(() => new Promise((done) => { resolve = done; })) });

    const cleanup = react.effects[0]();
    cleanup();
    resolve(granted());
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[STATUS]).not.toHaveBeenCalledWith(ALERT_HISTORY_STATUS.READY);
    expect(react.setters[ALERTS].mock.calls.every(([value]) => value === null)).toBe(true);
  });

  it('avisa si las alertas activas del resumen difieren de las ACTIVA del historial', () => {
    react.preset = { [ALERTS]: [{ ...ALERT, status: 'ACTIVA' }], [STATUS]: ALERT_HISTORY_STATUS.READY };

    expect(render({ activeAlerts: [ALERT], source: source() }).hasSummaryMismatch).toBe(false);
    expect(render({ activeAlerts: [], source: source() }).hasSummaryMismatch).toBe(true);
    expect(render({ activeAlerts: null, source: source() }).hasSummaryMismatch).toBe(false);
  });

  it('un historial vacío frente a un resumen con alertas activas también se avisa', () => {
    react.preset = { [STATUS]: ALERT_HISTORY_STATUS.EMPTY };

    expect(render({ activeAlerts: [ALERT], source: source() }).hasSummaryMismatch).toBe(true);
    expect(render({ activeAlerts: [], source: source() }).hasSummaryMismatch).toBe(false);
  });

  it('solo consulta: reintentar es la única operación', () => {
    const result = render({ source: source() });

    expect(Object.keys(result).filter((key) => typeof result[key] === 'function')).toEqual(['retry']);
    result.retry();
    expect(react.setters[ATTEMPT]).toHaveBeenCalledTimes(1);
  });
});
