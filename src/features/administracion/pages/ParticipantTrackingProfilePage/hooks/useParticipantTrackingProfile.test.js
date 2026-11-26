import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { TRACKING_CLIENT_ERROR, trackingError } from '../../../services/trackingErrors.js';
import { TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';
import { PROFILE_STATUS, useParticipantTrackingProfile } from './useParticipantTrackingProfile.js';

/*
 * React mínimo para entorno node: useState devuelve el estado inicial
 * con un setter espía; useEffect se guarda para ejecutarlo; useRef crea
 * un objeto { current }.
 */
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
  useRef(initial) {
    return { current: initial };
  },
}));

// Orden de los useState y de los efectos del hook.
const COHORT = 1;
const CODE = 2;
const PROFILE = 3;
const STATUS = 4;
const LOADING = 5;
const ATTEMPT = 6;
const FOCUS_EFFECT = 0;
const COHORT_EFFECT = 1;
const PROFILE_EFFECT = 2;

const PARTICIPANT = 'P-7F3A91C2';
const REQUEST = Object.freeze({ cohortId: 'c-1', participantCode: PARTICIPANT });

const body = (changes = {}) => ({
  codigo_participante: PARTICIPANT,
  indicadores_adherencia: { tasa_adherencia: 0.41, dias_con_registro: 10 },
  indicadores_progreso: { nivel_progreso: 'EN_AVANCE', unidades_completadas: 4 },
  tendencia_consumo: 'REDUCCION',
  alertas_activas: [{ id_alerta: 'a-1', tipo_alerta: 'INACTIVIDAD', fecha_generacion: '2026-11-20T14:00:00Z', estado_resolucion: 'ACTIVA' }],
  fecha_actualizacion: '2026-11-22T05:00:00Z',
  modo_consulta: 'SOLO_LECTURA',
  correo: 'x@example.com',
  ...changes,
});

const http = (status, codigo) => toApiError({ response: { status, data: { status, codigo, mensaje: 'Mensaje.' } } });

function source({ mode = TRACKING_SOURCE_MODE.API, getProfile, getCohort } = {}) {
  return {
    getMode: () => mode,
    getCohort: getCohort ?? vi.fn().mockResolvedValue({ id: 'c-1', name: 'Cohorte' }),
    getProfile: getProfile ?? vi.fn().mockResolvedValue(body()),
  };
}

function render(args = {}, hook = useParticipantTrackingProfile) {
  react.setters = [];
  react.effects = [];
  return hook({ ...REQUEST, ...args });
}

async function loadWith(src, args = {}) {
  render({ source: src, ...args });
  react.effects[PROFILE_EFFECT]();
  await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

describe('useParticipantTrackingProfile (RF-128, contrato real)', () => {
  it('pide a la fuente la cohorte y el código de la ruta, con señal de cancelación', async () => {
    const src = source();
    await loadWith(src);

    expect(src.getProfile).toHaveBeenCalledWith('c-1', PARTICIPANT, { signal: expect.any(AbortSignal) });
  });

  it('200 válido: perfil del contrato, sin campos ajenos, y código confirmado', async () => {
    await loadWith(source());

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.READY);
    expect(lastValue(CODE)).toBe(PARTICIPANT);
    expect(lastValue(PROFILE)).toEqual({
      progressLevel: 'EN_AVANCE',
      completedUnits: 4,
      adherence: 0.41,
      daysWithRecord: 10,
      trend: 'REDUCCION',
      activeAlerts: [{ id: 'a-1', type: 'INACTIVIDAD', generatedAt: '2026-11-20T14:00:00Z', status: 'ACTIVA' }],
      updatedAt: '2026-11-22T05:00:00Z',
    });
    expect(JSON.stringify(lastValue(PROFILE))).not.toContain('@');
  });

  it('204 sin perfil: conserva el código pedido, sin indicadores', async () => {
    await loadWith(source({ getProfile: vi.fn().mockResolvedValue(null) }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.NO_PROFILE);
    expect(lastValue(CODE)).toBe(PARTICIPANT);
    expect(lastValue(PROFILE)).toBeNull();
  });

  it.each([
    [http(403, 'SIN_PERMISO_INDIVIDUAL'), PROFILE_STATUS.DENIED],
    [http(404, 'PARTICIPANTE_NO_ENCONTRADO'), PROFILE_STATUS.NOT_FOUND],
    [http(404, 'COHORTE_NO_ENCONTRADA'), PROFILE_STATUS.COHORT_NOT_FOUND],
    [http(409, 'INCONSISTENCIA_PARTICIPANTE'), PROFILE_STATUS.INCONSISTENT],
    [http(503, 'M05_NO_DISPONIBLE'), PROFILE_STATUS.UNAVAILABLE],
    [http(500, 'ERROR_CONSULTA_SEGUIMIENTO'), PROFILE_STATUS.ERROR],
    [http(401, 'NO_AUTENTICADO'), PROFILE_STATUS.SESSION_REQUIRED],
    [toApiError(new Error('Network Error')), PROFILE_STATUS.ERROR],
    [trackingError(null, TRACKING_CLIENT_ERROR.INVALID_CODE), PROFILE_STATUS.INVALID_CODE],
    [trackingError(null, TRACKING_CLIENT_ERROR.OUTSIDE_COHORT), PROFILE_STATUS.OUTSIDE_COHORT],
  ])('error %o: %s, sin código ni datos', async (error, status) => {
    await loadWith(source({ getProfile: vi.fn().mockRejectedValue(error) }));

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(CODE)).toBeNull();
    expect(lastValue(PROFILE)).toBeNull();
  });

  it.each([
    ['de otro participante', body({ codigo_participante: 'P-00000001' }), PROFILE_STATUS.INCONSISTENT],
    ['malformada', body({ indicadores_adherencia: { tasa_adherencia: 41, dias_con_registro: 1 } }), PROFILE_STATUS.ERROR],
    ['sin modo de solo lectura', body({ modo_consulta: undefined }), PROFILE_STATUS.ERROR],
  ])('respuesta %s: ningún dato', async (_, response, status) => {
    await loadWith(source({ getProfile: vi.fn().mockResolvedValue(response) }));

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(CODE)).toBeNull();
    expect(lastValue(PROFILE)).toBeNull();
  });

  it('aislamiento: al cambiar de participante cancela la consulta y descarta su resultado tardío', async () => {
    let resolve;
    const getProfile = vi.fn(() => new Promise((done) => { resolve = done; }));
    render({ source: source({ getProfile }) });
    const cleanup = react.effects[PROFILE_EFFECT]();
    const { signal } = getProfile.mock.calls[0][2];

    cleanup();
    resolve(body());
    await new Promise((done) => setTimeout(done, 0));

    expect(signal.aborted).toBe(true);
    expect(react.setters[PROFILE]).not.toHaveBeenCalledWith(expect.objectContaining({ progressLevel: 'EN_AVANCE' }));
    expect(react.setters[LOADING]).not.toHaveBeenCalledWith(false);
  });

  it('al empezar una consulta borra el código y el perfil anteriores', async () => {
    const getProfile = vi.fn(() => new Promise(() => {}));
    render({ source: source({ getProfile }) });
    react.effects[PROFILE_EFFECT]();

    expect(react.setters[CODE]).toHaveBeenCalledWith(null);
    expect(react.setters[PROFILE]).toHaveBeenCalledWith(null);
    expect(react.setters[LOADING]).toHaveBeenCalledWith(true);
  });

  it('modo de la fuente: demostración o API', () => {
    expect(render({ source: source({ mode: TRACKING_SOURCE_MODE.DEMO }) }).isDemo).toBe(true);
    expect(render({ source: source() }).isDemo).toBe(false);
  });

  it('al abrirse lleva el foco al título', () => {
    const result = render({ source: source() });
    result.headingRef.current = { focus: vi.fn() };

    react.effects[FOCUS_EFFECT]();

    expect(result.headingRef.current.focus).toHaveBeenCalled();
  });

  it('carga la cohorte para el encabezado y tolera su fallo', async () => {
    render({ source: source({ getCohort: vi.fn().mockRejectedValue(new Error('x')) }) });
    react.effects[COHORT_EFFECT]();

    await vi.waitFor(() => expect(react.setters[COHORT]).toHaveBeenCalledWith(null));
  });

  it('solo consulta: reintentar es la única operación', () => {
    const result = render({ source: source() });

    expect(Object.keys(result).filter((key) => typeof result[key] === 'function')).toEqual(['retry']);
    result.retry();
    expect(react.setters[ATTEMPT].mock.lastCall[0](0)).toBe(1);
  });
});
