import { describe, expect, it } from 'vitest';

import { TEMPORARY_ID_PREFIX, createCohortStore } from './cohortDemoStore.js';

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
