import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COHORT_SOURCE_MODE } from '../../../types/cohortSourceMode.js';
import {
  COHORT_DETAIL_ERROR_MESSAGE,
  PARTICIPANTS_ERROR_MESSAGE,
  useCohortDetail,
} from './useCohortDetail.js';

// React mínimo para entorno node: useState devuelve el estado
// inicial con un setter espía; useEffect se guarda para ejecutarlo.
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
const SET_COHORT = 1;
const SET_PARTICIPANTS = 2;
const SET_LOADING = 3;
const SET_ERROR = 4;
const SET_NOT_FOUND = 5;
const SET_PARTICIPANTS_ERROR = 6;
const SET_ATTEMPT = 7;

const COHORT = Object.freeze({ id: 'c-1', name: 'Cohorte', status: 'ACTIVA' });
const PARTICIPANTS = Object.freeze([
  Object.freeze({ id: 'p-1', cohortId: 'c-1', code: 'X-1', participationStatus: 'ACTIVO' }),
  Object.freeze({ id: 'p-2', cohortId: 'c-1', code: 'X-2', participationStatus: 'PENDIENTE_VALIDACION' }),
]);

function source({ mode = COHORT_SOURCE_MODE.DEMO, cohort, participants } = {}) {
  return {
    getMode: () => mode,
    getCohort: cohort ?? vi.fn().mockResolvedValue(COHORT),
    listParticipants: participants ?? vi.fn().mockResolvedValue(PARTICIPANTS),
  };
}

// Ejecuta el hook y espera a que termine la carga.
async function loadWith(options, hook = useCohortDetail) {
  const result = hook({ cohortId: 'c-1', source: source(options) });
  react.effects[0]();
  await vi.waitFor(() => expect(react.setters[SET_LOADING]).toHaveBeenLastCalledWith(false));
  return result;
}

beforeEach(() => {
  react.setters = [];
  react.effects = [];
});

describe('useCohortDetail', () => {
  it('con la integración pendiente no consulta ninguna fuente', () => {
    const cohort = vi.fn();
    const participants = vi.fn();
    const result = useCohortDetail({
      cohortId: 'c-1',
      source: source({ mode: COHORT_SOURCE_MODE.PENDING_INTEGRATION, cohort, participants }),
    });

    expect(result).toMatchObject({ isIntegrationPending: true, isDemo: false, isLoading: false });
    expect(react.effects[0]()).toBeUndefined();
    expect(cohort).not.toHaveBeenCalled();
    expect(participants).not.toHaveBeenCalled();
  });

  it('consulta la cohorte y sus participantes por el identificador de la ruta', async () => {
    const cohort = vi.fn().mockResolvedValue(COHORT);
    const participants = vi.fn().mockResolvedValue(PARTICIPANTS);
    const result = useCohortDetail({ cohortId: 'c-1', source: source({ cohort, participants }) });

    expect(result).toMatchObject({ isDemo: true, isLoading: true, cohort: null, participants: [] });
    react.effects[0]();
    await vi.waitFor(() => expect(react.setters[SET_LOADING]).toHaveBeenLastCalledWith(false));
    expect(cohort).toHaveBeenCalledWith('c-1');
    expect(participants).toHaveBeenCalledWith('c-1');
    expect(react.setters[SET_COHORT]).toHaveBeenLastCalledWith(COHORT);
    expect(react.setters[SET_PARTICIPANTS]).toHaveBeenLastCalledWith(PARTICIPANTS);
    expect(react.setters[SET_NOT_FOUND]).toHaveBeenLastCalledWith(false);
  });

  it('en modo API consulta la cohorte y reserva la gestión de participantes para RF-125', async () => {
    const cohort = vi.fn().mockResolvedValue(COHORT);
    const participants = vi.fn();
    const result = await loadWith({ mode: COHORT_SOURCE_MODE.API, cohort, participants });

    expect(cohort).toHaveBeenCalledWith('c-1');
    expect(participants).not.toHaveBeenCalled();
    expect(react.setters[SET_COHORT]).toHaveBeenLastCalledWith(COHORT);
    expect(result).toMatchObject({ isParticipantsIntegrationPending: true, canManage: false });
  });

  it('presenta los participantes tal como llegan: no recalcula su estado', async () => {
    await loadWith();

    const [shown] = react.setters[SET_PARTICIPANTS].mock.lastCall;
    expect(shown).toBe(PARTICIPANTS);
    expect(shown[1].participationStatus).toBe('PENDIENTE_VALIDACION');
  });

  it('cohorte inexistente: no encontrada, sin participantes', async () => {
    await loadWith({ cohort: vi.fn().mockResolvedValue(null), participants: vi.fn().mockResolvedValue(null) });

    expect(react.setters[SET_NOT_FOUND]).toHaveBeenLastCalledWith(true);
    expect(react.setters[SET_PARTICIPANTS]).toHaveBeenLastCalledWith([]);
    expect(react.setters[SET_COHORT]).toHaveBeenLastCalledWith(null);
  });

  it('si la fuente de participantes no reconoce la cohorte, también es no encontrada', async () => {
    await loadWith({ participants: vi.fn().mockResolvedValue(null) });

    expect(react.setters[SET_NOT_FOUND]).toHaveBeenLastCalledWith(true);
  });

  it('un fallo al cargar la cohorte es un error de la página, sin datos de reemplazo', async () => {
    await loadWith({ cohort: vi.fn().mockRejectedValue(new Error('x')) });

    expect(react.setters[SET_ERROR]).toHaveBeenLastCalledWith(COHORT_DETAIL_ERROR_MESSAGE);
    expect(react.setters[SET_PARTICIPANTS]).toHaveBeenLastCalledWith([]);
    expect(react.setters[SET_NOT_FOUND]).not.toHaveBeenCalledWith(true);
  });

  it('un fallo de los participantes conserva la cohorte y nunca se presenta como lista vacía', async () => {
    await loadWith({ participants: vi.fn().mockRejectedValue(new Error('x')) });

    expect(react.setters[SET_COHORT]).toHaveBeenLastCalledWith(COHORT);
    expect(react.setters[SET_PARTICIPANTS_ERROR]).toHaveBeenLastCalledWith(PARTICIPANTS_ERROR_MESSAGE);
    expect(react.setters[SET_ERROR]).not.toHaveBeenCalledWith(COHORT_DETAIL_ERROR_MESSAGE);
  });

  it('una respuesta que no es una lista se trata como vacía', async () => {
    await loadWith({ participants: vi.fn().mockResolvedValue({ no: 'lista' }) });

    expect(react.setters[SET_PARTICIPANTS]).toHaveBeenLastCalledWith([]);
  });

  it('ignora la respuesta si el componente ya se desmontó', async () => {
    let resolve;
    useCohortDetail({
      cohortId: 'c-1',
      source: source({ cohort: () => new Promise((done) => { resolve = done; }) }),
    });

    const cleanup = react.effects[0]();
    cleanup();
    resolve(COHORT);
    await new Promise((done) => setTimeout(done, 0));
    expect(react.setters[SET_COHORT]).not.toHaveBeenCalled();
    expect(react.setters[SET_LOADING]).not.toHaveBeenCalledWith(false);
  });

  it('cuenta los estados informados y reintenta a petición', () => {
    const result = useCohortDetail({ cohortId: 'c-1', source: source() });

    expect(result.participationCounts).toEqual({ ACTIVO: 0, INACTIVO: 0, PENDIENTE_VALIDACION: 0 });
    result.retry();
    expect(react.setters[SET_ATTEMPT]).toHaveBeenCalledTimes(1);
  });

  it('no edita: solo reintenta y refleja asignaciones y retiros ya resueltos por la fuente', () => {
    const result = useCohortDetail({ cohortId: 'c-1', source: source() });
    const operations = Object.keys(result).filter((key) => typeof result[key] === 'function');

    expect(operations).toEqual(['retry', 'addParticipants', 'removeParticipant']);
  });

  it('removeParticipant quita solo a ese participante y conserva el estado de los demás', () => {
    const src = source();
    const result = useCohortDetail({ cohortId: 'c-1', source: src });

    result.removeParticipant('p-1');
    const [update] = react.setters[SET_PARTICIPANTS].mock.lastCall;

    expect(update(PARTICIPANTS)).toEqual([PARTICIPANTS[1]]);
    expect(update(PARTICIPANTS)[0]).toBe(PARTICIPANTS[1]);
    expect(src.getCohort).not.toHaveBeenCalled();
  });

  it('addParticipants añade los asignados sin duplicar ni tocar la fuente', () => {
    const src = source();
    const result = useCohortDetail({ cohortId: 'c-1', source: src });
    const added = { id: 'p-3', cohortId: 'c-1', code: 'X-3', participationStatus: 'ACTIVO' };
    const repeated = { ...PARTICIPANTS[0], participationStatus: 'INACTIVO' };

    result.addParticipants([added, repeated]);
    const [update] = react.setters[SET_PARTICIPANTS].mock.lastCall;

    expect(update(PARTICIPANTS)).toEqual([PARTICIPANTS[1], added, repeated]);
    expect(src.getCohort).not.toHaveBeenCalled();
    expect(src.listParticipants).not.toHaveBeenCalled();
  });

  it('sin integración no permite gestionar; en demostración sí', () => {
    expect(
      useCohortDetail({ cohortId: 'c-1', source: source({ mode: COHORT_SOURCE_MODE.PENDING_INTEGRATION }) }).canManage,
    ).toBe(false);
    expect(useCohortDetail({ cohortId: 'c-1', source: source() }).canManage).toBe(true);
  });
});
