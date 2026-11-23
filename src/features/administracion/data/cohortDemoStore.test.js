import { describe, expect, it } from 'vitest';

import { COHORT_TRANSITION } from '../services/cohortTransitions.js';
import { STATUS_CHANGE_NOT_FOUND, TEMPORARY_ID_PREFIX, createCohortStore } from './cohortDemoStore.js';

// Conjunto arbitrario, distinto de los datos de demostración: el
// almacén no depende de ningún registro concreto.
const COHORTS = Object.freeze([
  Object.freeze({ id: 'x-1', name: 'Uno', startDate: '2027-01-04', endDate: '2027-03-26', status: 'ACTIVA', scheduleId: 'p' }),
]);
const SCHEDULES = Object.freeze([Object.freeze({ id: 'p', name: 'Plan P', status: 'ACTIVO' })]);
const VALUES = Object.freeze({ name: 'Dos', startDate: '2027-02-01', endDate: '2027-02-01', scheduleId: 'p' });

describe('Almacén temporal de cohortes', () => {
  it('funciona con cualquier conjunto inicial sin modificarlo', () => {
    const store = createCohortStore({ cohorts: COHORTS, schedules: SCHEDULES });
    const created = store.createCohort(VALUES);
    store.updateCohort('x-1', VALUES);

    expect(created).toMatchObject({ id: `${TEMPORARY_ID_PREFIX}1`, status: 'BORRADOR', scheduleName: 'Plan P' });
    expect(store.listCohorts()).toHaveLength(2);
    expect(COHORTS).toHaveLength(1);
    expect(COHORTS[0].name).toBe('Uno');
  });

  it('cada almacén es independiente (una recarga empieza de cero)', () => {
    const first = createCohortStore({ cohorts: COHORTS, schedules: SCHEDULES });
    first.createCohort(VALUES);
    const second = createCohortStore({ cohorts: COHORTS, schedules: SCHEDULES });

    expect(second.listCohorts()).toEqual(COHORTS);
    expect(second.createCohort(VALUES).id).toBe(`${TEMPORARY_ID_PREFIX}1`);
  });

  it('la edición conserva el estado y la cohorte inexistente devuelve null', () => {
    const store = createCohortStore({ cohorts: COHORTS, schedules: SCHEDULES });

    expect(store.updateCohort('x-1', VALUES)).toMatchObject({ name: 'Dos', status: 'ACTIVA' });
    expect(store.updateCohort('nada', VALUES)).toBeNull();
    expect(store.findCohort('nada')).toBeNull();
  });

  it('las listas devueltas son inmutables', () => {
    const store = createCohortStore({ cohorts: COHORTS, schedules: SCHEDULES });

    expect(Object.isFrozen(store.listCohorts())).toBe(true);
    expect(() => store.listCohorts().push({})).toThrow(TypeError);
  });

  it('sin cronograma conocido no inventa su nombre', () => {
    const store = createCohortStore({ cohorts: [], schedules: [] });

    expect(store.createCohort(VALUES).scheduleName).toBeUndefined();
  });
});

describe('Cambio de estado en el almacén temporal', () => {
  const DRAFT = Object.freeze({ id: 'x-2', name: 'Borrador', startDate: '2027-01-04', endDate: '2027-03-26', status: 'BORRADOR', scheduleId: 'p' });
  const INACTIVE_PLAN = Object.freeze([Object.freeze({ id: 'p', name: 'Plan P', status: 'INACTIVO' })]);

  it('activa y luego inactiva, sin tocar otras cohortes ni los registros iniciales', () => {
    const store = createCohortStore({ cohorts: [...COHORTS, DRAFT], schedules: SCHEDULES });

    expect(store.changeCohortStatus('x-2', COHORT_TRANSITION.ACTIVATE)).toMatchObject({ ok: true, cohort: { status: 'ACTIVA' } });
    expect(store.changeCohortStatus('x-2', COHORT_TRANSITION.INACTIVATE)).toMatchObject({ ok: true, cohort: { status: 'INACTIVA' } });
    expect(store.findCohort('x-2').status).toBe('INACTIVA');
    expect(store.findCohort('x-1')).toBe(COHORTS[0]);
    expect(DRAFT.status).toBe('BORRADOR');
  });

  it('una acción repetida no aplica dos veces: la segunda se rechaza y no cambia nada', () => {
    const store = createCohortStore({ cohorts: [DRAFT], schedules: SCHEDULES });
    store.changeCohortStatus('x-2', COHORT_TRANSITION.ACTIVATE);
    const before = store.listCohorts();

    expect(store.changeCohortStatus('x-2', COHORT_TRANSITION.ACTIVATE)).toMatchObject({
      ok: false, reason: 'NOT_ALLOWED', cohort: { status: 'ACTIVA' },
    });
    expect(store.listCohorts()).toBe(before);
  });

  it('vuelve a verificar con los datos actuales: cronograma inactivo bloquea la activación', () => {
    const store = createCohortStore({ cohorts: [DRAFT], schedules: INACTIVE_PLAN });

    expect(store.changeCohortStatus('x-2', COHORT_TRANSITION.ACTIVATE)).toMatchObject({
      ok: false,
      reason: 'SCHEDULE_NOT_ACTIVE',
      message: 'No es posible activar la cohorte porque el cronograma asociado no está activo.',
    });
    expect(store.findCohort('x-2').status).toBe('BORRADOR');
  });

  it('transición no definida e identificador inexistente', () => {
    const store = createCohortStore({ cohorts: [{ ...DRAFT, status: 'INACTIVA' }], schedules: SCHEDULES });

    expect(store.changeCohortStatus('x-2', COHORT_TRANSITION.INACTIVATE).ok).toBe(false);
    expect(store.findCohort('x-2').status).toBe('INACTIVA');
    expect(store.changeCohortStatus('nada', COHORT_TRANSITION.ACTIVATE)).toEqual({
      ok: false, reason: STATUS_CHANGE_NOT_FOUND, cohort: null,
    });
  });
});
