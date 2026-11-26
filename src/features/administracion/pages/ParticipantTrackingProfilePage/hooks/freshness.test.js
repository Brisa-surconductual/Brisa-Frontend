import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CURRENT_FRESHNESS } from '../../../services/dataFreshness.js';
import { FRESHNESS_STATE } from '../../../types/dataFreshness.js';
import { SECTION_STATUS } from '../../../types/participantEngagement.js';
import { ALERT_HISTORY_STATUS, TRACKING_ACCESS, TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';
import { useAlertHistory } from './useAlertHistory.js';
import { PROFILE_STATUS, useParticipantTrackingProfile } from './useParticipantTrackingProfile.js';
import { useTemporalLocation } from './useTemporalLocation.js';

/*
 * Modo degradado (RF-149) en los hooks de la ficha: datos con marca
 * DEGRADADO y fecha confiable se muestran con su fecha; sin fecha
 * confiable, o con marca desconocida, no se muestran; una denegación
 * nunca se elude con datos antiguos.
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
  useRef(initial) {
    return { current: initial };
  },
}));

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });
const AT = '2026-03-08T14:30:00-05:00';
const STALE = Object.freeze({ dataState: 'DEGRADADO', lastAvailableAt: AT });
const UNDATED = Object.freeze({ dataState: 'DEGRADADO', lastAvailableAt: '2026-03-08 14:30' });

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

async function run(hook, args, { effect, loading }) {
  react.setters = [];
  react.effects = [];
  hook({ ...REQUEST, ...args });
  react.effects[effect]();
  await vi.waitFor(() => expect(react.setters[loading]).toHaveBeenLastCalledWith(false));
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
  react.preset = {};
});

describe('Ficha (RF-128, M05)', () => {
  // mode, cohort, code, profile, status, isLoading, attempt, freshness.
  const CODE = 2;
  const PROFILE = 3;
  const STATUS = 4;
  const FRESHNESS = 7;
  const PARTICIPANT = 'P-7F3A91C2';
  const granted = (extra = {}) => ({
    codigo_participante: PARTICIPANT,
    indicadores_adherencia: { tasa_adherencia: 0.4, dias_con_registro: 10 },
    indicadores_progreso: { nivel_progreso: 'INICIAL', unidades_completadas: 1 },
    tendencia_consumo: 'ESTABLE',
    alertas_activas: [],
    fecha_actualizacion: AT,
    modo_consulta: 'SOLO_LECTURA',
    ...extra,
  });
  const source = (response) => ({
    getMode: () => TRACKING_SOURCE_MODE.API,
    getCohort: vi.fn().mockResolvedValue(null),
    getProfile: typeof response === 'function' ? response : vi.fn().mockResolvedValue(response),
  });
  const load = (response) =>
    run(useParticipantTrackingProfile, { participantCode: PARTICIPANT, source: source(response) }, { effect: 2, loading: 5 });

  it('actual: datos sin marca', async () => {
    await load(granted());

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.READY);
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('desactualizado con fecha: se muestra con la fecha exacta', async () => {
    await load(granted(STALE));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.READY);
    expect(lastValue(PROFILE)).not.toBeNull();
    expect(lastValue(FRESHNESS)).toEqual({ state: FRESHNESS_STATE.STALE, lastAvailableAt: AT });
  });

  it('sin perfil (204, sin cuerpo): conserva el código y no hay marca', async () => {
    await load(null);

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.NO_PROFILE);
    expect(lastValue(CODE)).toBe(PARTICIPANT);
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('desactualizado sin fecha confiable: no muestra código ni indicadores', async () => {
    await load(granted(UNDATED));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.STALE_UNDATED);
    expect(lastValue(PROFILE)).toBeNull();
    expect(lastValue(CODE)).toBeNull();
  });

  it('marca desconocida: error, sin datos', async () => {
    await load(granted({ dataState: 'PARCIAL' }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.ERROR);
    expect(lastValue(PROFILE)).toBeNull();
  });

  it('denegado (403): sin datos antiguos que eludan la denegación', async () => {
    await load(vi.fn().mockRejectedValue({ status: 403, codigo: 'SIN_PERMISO_INDIVIDUAL' }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.DENIED);
    expect(lastValue(PROFILE)).toBeNull();
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('de otro participante y degradado: bloqueado', async () => {
    await load(granted({ ...STALE, codigo_participante: 'P-00000001' }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.INCONSISTENT);
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('no disponible sin datos anteriores (FA2): error propio, sin datos ficticios', async () => {
    await load(vi.fn().mockRejectedValue({ status: 503, codigo: 'M05_NO_DISPONIBLE' }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.UNAVAILABLE);
    expect(lastValue(PROFILE)).toBeNull();
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });
});

describe('Historial de alertas (RF-129, M05)', () => {
  // alerts, status, isLoading, attempt, freshness.
  const ALERTS = 0;
  const STATUS = 1;
  const FRESHNESS = 4;
  const alert = { reference: 'ref-1', type: 'INACTIVIDAD', source: 'RF-68', generatedAt: AT, status: 'RESUELTA', resolvedAt: null };
  const load = (response) => run(useAlertHistory, { enabled: true, source: { getHistory: vi.fn().mockResolvedValue(response) } }, { effect: 0, loading: 2 });

  it('desactualizado con fecha: alertas visibles con su marca', async () => {
    await load({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, alerts: [alert], ...STALE });

    expect(lastValue(STATUS)).toBe(ALERT_HISTORY_STATUS.READY);
    expect(lastValue(ALERTS)).toHaveLength(1);
    expect(lastValue(FRESHNESS).lastAvailableAt).toBe(AT);
  });

  it('desactualizado sin fecha confiable: sin alertas', async () => {
    await load({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, alerts: [alert], ...UNDATED });

    expect(lastValue(STATUS)).toBe(ALERT_HISTORY_STATUS.STALE_UNDATED);
    expect(lastValue(ALERTS)).toBeNull();
  });

  it('denegado y degradado: sin alertas ni marca', async () => {
    await load({ access: TRACKING_ACCESS.DENIED, ...REQUEST, alerts: [alert], ...STALE });

    expect(lastValue(STATUS)).toBe(ALERT_HISTORY_STATUS.DENIED);
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('sin habilitar no expone una marca anterior', () => {
    react.preset = { [STATUS]: ALERT_HISTORY_STATUS.READY, [FRESHNESS]: { state: FRESHNESS_STATE.STALE, lastAvailableAt: AT } };

    expect(useAlertHistory({ ...REQUEST, enabled: false }).freshness).toEqual(CURRENT_FRESHNESS);
  });
});

describe('Secciones M06, M07 y M04 (consulta común)', () => {
  // data, status, isLoading, attempt, freshness.
  const DATA = 0;
  const STATUS = 1;
  const FRESHNESS = 4;
  const temporal = { currentUnitName: 'Unidad 3', effectiveElapsedSeconds: 0, programFinished: false, pauses: [] };
  const load = (response) => run(useTemporalLocation, { enabled: true, source: { getTemporal: vi.fn().mockResolvedValue(response) } }, { effect: 0, loading: 2 });

  it('consulta temporal actual: datos de M04 sin marca', async () => {
    await load({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, temporal });

    expect(lastValue(STATUS)).toBe(SECTION_STATUS.READY);
    expect(lastValue(DATA)).toEqual(temporal);
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('desactualizado con fecha: datos con su marca', async () => {
    await load({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, temporal, ...STALE });

    expect(lastValue(DATA)).toEqual(temporal);
    expect(lastValue(FRESHNESS).state).toBe(FRESHNESS_STATE.STALE);
  });

  it('sin datos (204) y desactualizado: conserva la marca', async () => {
    await load({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, temporal: null, ...STALE });

    expect(lastValue(STATUS)).toBe(SECTION_STATUS.EMPTY);
    expect(lastValue(FRESHNESS).state).toBe(FRESHNESS_STATE.STALE);
  });

  it.each([
    ['sin fecha confiable', UNDATED, SECTION_STATUS.STALE_UNDATED],
    ['marca desconocida', { dataState: 'OTRO' }, SECTION_STATUS.ERROR],
  ])('%s: sin datos', async (_, marca, status) => {
    await load({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, temporal, ...marca });

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(DATA)).toBeNull();
  });

  it('denegado y degradado: nunca muestra datos antiguos', async () => {
    await load({ access: TRACKING_ACCESS.DENIED, ...REQUEST, temporal, ...STALE });

    expect(lastValue(STATUS)).toBe(SECTION_STATUS.DENIED);
    expect(lastValue(DATA)).toBeNull();
    expect(lastValue(FRESHNESS)).toEqual(CURRENT_FRESHNESS);
  });

  it('sin habilitar no consulta M04', () => {
    const getTemporal = vi.fn();
    react.setters = [];
    react.effects = [];

    expect(useTemporalLocation({ ...REQUEST, enabled: false, source: { getTemporal } })).toMatchObject({ temporal: null, status: null });
    expect(react.effects[0]()).toBeUndefined();
    expect(getTemporal).not.toHaveBeenCalled();
  });
});
