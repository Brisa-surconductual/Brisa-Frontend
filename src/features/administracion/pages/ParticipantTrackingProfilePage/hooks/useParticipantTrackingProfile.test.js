import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TRACKING_ACCESS, TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';
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

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

const granted = (changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  reference: 'ref-1',
  code: 'X-1',
  profile: { progress: 40, adherence: 60, trend: 'ESTABLE', activeAlerts: [], updatedAt: '2026-03-09T06:00:00-05:00', email: 'x@example.com' },
  participantId: 'interno',
  ...changes,
});

function source({ mode = TRACKING_SOURCE_MODE.DEMO, getProfile, getCohort } = {}) {
  return {
    getMode: () => mode,
    getCohort: getCohort ?? vi.fn().mockResolvedValue({ id: 'c-1', name: 'Cohorte' }),
    getProfile: getProfile ?? vi.fn().mockResolvedValue(granted()),
  };
}

// Ejecuta el hook con la cohorte y la referencia de prueba.
function render(args = {}, hook = useParticipantTrackingProfile) {
  react.setters = [];
  react.effects = [];
  return hook({ ...REQUEST, ...args });
}

async function loadWith(src) {
  render({ source: src });
  react.effects[PROFILE_EFFECT]();
  await vi.waitFor(() => expect(react.setters[LOADING]).toHaveBeenLastCalledWith(false));
}

const lastValue = (position) => react.setters[position].mock.lastCall?.[0];

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

describe('useParticipantTrackingProfile', () => {
  it('con la integración pendiente no consulta nada', () => {
    const src = source({ mode: TRACKING_SOURCE_MODE.PENDING_INTEGRATION });
    const result = render({ source: src });

    expect(result).toMatchObject({ isIntegrationPending: true, isDemo: false, isLoading: false, profile: null, code: null });
    expect(react.effects[COHORT_EFFECT]()).toBeUndefined();
    expect(react.effects[PROFILE_EFFECT]()).toBeUndefined();
    expect(src.getProfile).not.toHaveBeenCalled();
    expect(src.getCohort).not.toHaveBeenCalled();
  });

  it('pide a la fuente la cohorte y la referencia de la ruta', async () => {
    const src = source();
    await loadWith(src);

    expect(src.getProfile).toHaveBeenCalledWith('c-1', 'ref-1');
    react.effects[COHORT_EFFECT]();
    expect(src.getCohort).toHaveBeenCalledWith('c-1');
  });

  it('consulta autorizada: guarda solo los campos permitidos', async () => {
    await loadWith(source());

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.READY);
    expect(lastValue(CODE)).toBe('X-1');
    expect(Object.keys(lastValue(PROFILE)).sort()).toEqual(['activeAlerts', 'adherence', 'progress', 'trend', 'updatedAt']);
    expect(JSON.stringify(lastValue(PROFILE))).not.toContain('@');
  });

  it('sin perfil (204): conserva el código, sin indicadores', async () => {
    await loadWith(source({ getProfile: vi.fn().mockResolvedValue(granted({ profile: null })) }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.NO_PROFILE);
    expect(lastValue(CODE)).toBe('X-1');
    expect(lastValue(PROFILE)).toBeNull();
  });

  it.each([
    ['DENEGADO', { access: TRACKING_ACCESS.DENIED }, PROFILE_STATUS.DENIED],
    ['sin campo de acceso', { access: undefined }, PROFILE_STATUS.DENIED],
    ['otro participante', { reference: 'ref-2' }, PROFILE_STATUS.INCONSISTENT],
    ['otra cohorte', { cohortId: 'c-2' }, PROFILE_STATUS.INCONSISTENT],
  ])('%s: ni código ni indicadores', async (_, changes, status) => {
    await loadWith(source({ getProfile: vi.fn().mockResolvedValue(granted(changes)) }));

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(CODE)).toBeNull();
    expect(lastValue(PROFILE)).toBeNull();
  });

  it.each([
    ['ACCESO_DENEGADO', PROFILE_STATUS.DENIED],
    ['PARTICIPANTE_NO_ENCONTRADO', PROFILE_STATUS.NOT_FOUND],
    ['COHORTE_NO_ENCONTRADA', PROFILE_STATUS.COHORT_NOT_FOUND],
    ['PARTICIPANTE_FUERA_DE_COHORTE', PROFILE_STATUS.OUTSIDE_COHORT],
    ['MODULO_NO_DISPONIBLE', PROFILE_STATUS.UNAVAILABLE],
    [undefined, PROFILE_STATUS.ERROR],
    ['OTRO_CODIGO', PROFILE_STATUS.ERROR],
  ])('rechazo con código %s', async (code, status) => {
    await loadWith(source({ getProfile: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { code })) }));

    expect(lastValue(STATUS)).toBe(status);
    expect(lastValue(PROFILE)).toBeNull();
    expect(lastValue(CODE)).toBeNull();
  });

  it('el texto del error no decide: «no disponible» sin código es un error genérico', async () => {
    await loadWith(source({ getProfile: vi.fn().mockRejectedValue(new Error('El módulo de seguimiento no se encuentra disponible')) }));

    expect(lastValue(STATUS)).toBe(PROFILE_STATUS.ERROR);
  });

  it('ignora la respuesta si el componente ya se desmontó', async () => {
    let resolve;
    render({ source: source({ getProfile: () => new Promise((done) => { resolve = done; }) }) });

    const cleanup = react.effects[PROFILE_EFFECT]();
    cleanup();
    resolve(granted());
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[PROFILE]).not.toHaveBeenCalled();
  });

  it('al abrirse lleva el foco al título', () => {
    const result = render({ source: source() });
    const focus = vi.fn();
    result.headingRef.current = { focus };

    react.effects[FOCUS_EFFECT]();
    expect(focus).toHaveBeenCalled();
  });

  it('carga la cohorte para el encabezado y tolera su fallo', async () => {
    render({ source: source({ getCohort: vi.fn().mockRejectedValue(new Error('x')) }) });

    react.effects[COHORT_EFFECT]();
    await vi.waitFor(() => expect(react.setters[COHORT]).toHaveBeenLastCalledWith(null));
  });

  it('solo consulta: reintentar es la única operación', () => {
    const result = render({ source: source() });

    expect(Object.keys(result).filter((key) => typeof result[key] === 'function')).toEqual(['retry']);
    result.retry();
    expect(react.setters[ATTEMPT]).toHaveBeenCalledTimes(1);
  });
});
