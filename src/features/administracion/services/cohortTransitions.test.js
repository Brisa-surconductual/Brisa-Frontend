import { describe, expect, it } from 'vitest';

import {
  COHORT_TRANSITION,
  TRANSITION_REJECTION,
  evaluateCohortTransition,
  getAvailableTransitions,
} from './cohortTransitions.js';

const SCHEDULES = Object.freeze([
  Object.freeze({ id: 's-activo', name: 'Activo', status: 'ACTIVO' }),
  Object.freeze({ id: 's-inactivo', name: 'Inactivo', status: 'INACTIVO' }),
]);

const DRAFT = Object.freeze({
  id: 'c-1',
  name: 'Cohorte',
  startDate: '2026-02-02',
  endDate: '2026-05-29',
  status: 'BORRADOR',
  scheduleId: 's-activo',
});
const ACTIVE = Object.freeze({ ...DRAFT, status: 'ACTIVA' });
const INACTIVE = Object.freeze({ ...DRAFT, status: 'INACTIVA' });

const evaluate = (cohort, transition = COHORT_TRANSITION.ACTIVATE) =>
  evaluateCohortTransition(cohort, transition, SCHEDULES);

describe('Transiciones disponibles por estado (RF-124)', () => {
  it.each([
    [DRAFT, [COHORT_TRANSITION.ACTIVATE]],
    [ACTIVE, [COHORT_TRANSITION.INACTIVATE]],
    [INACTIVE, [COHORT_TRANSITION.ACTIVATE]],
    [{ ...DRAFT, status: 'OTRO' }, []],
    [null, []],
  ])('%j → %j', (cohort, expected) => expect(getAvailableTransitions(cohort)).toEqual(expected));
});

describe('Activar: BORRADOR → ACTIVA', () => {
  it('se permite con información completa y cronograma activo', () => {
    expect(evaluate(DRAFT)).toEqual({ allowed: true, nextStatus: 'ACTIVA' });
  });

  it.each([
    ['nombre vacío', { name: '' }],
    ['nombre solo con espacios', { name: '   ' }],
    ['sin fecha de inicio', { startDate: '' }],
    ['fecha inválida', { endDate: '2026-02-30' }],
    ['fin anterior al inicio', { startDate: '2026-05-30', endDate: '2026-05-29' }],
  ])('se rechaza con %s', (_, change) => {
    expect(evaluate({ ...DRAFT, ...change })).toMatchObject({
      allowed: false,
      reason: TRANSITION_REJECTION.INCOMPLETE_DATA,
    });
  });

  it('se rechaza sin cronograma asociado', () => {
    expect(evaluate({ ...DRAFT, scheduleId: '' })).toEqual({
      allowed: false,
      reason: TRANSITION_REJECTION.NO_SCHEDULE,
      message: 'No es posible activar la cohorte porque no tiene un cronograma asociado.',
    });
  });

  it.each([['s-inactivo'], ['no-existe']])('se rechaza si el cronograma %s no está activo', (scheduleId) => {
    expect(evaluate({ ...DRAFT, scheduleId })).toEqual({
      allowed: false,
      reason: TRANSITION_REJECTION.SCHEDULE_NOT_ACTIVE,
      message: 'No es posible activar la cohorte porque el cronograma asociado no está activo.',
    });
  });

  it('permite fechas de inicio y fin iguales', () => {
    expect(evaluate({ ...DRAFT, endDate: DRAFT.startDate }).allowed).toBe(true);
  });
});

describe('Inactivar: ACTIVA → INACTIVA', () => {
  it('se permite sin más condiciones', () => {
    expect(evaluate(ACTIVE, COHORT_TRANSITION.INACTIVATE)).toEqual({ allowed: true, nextStatus: 'INACTIVA' });
  });
});

it('reactiva una cohorte inactiva con cronograma activo', () => {
  expect(evaluate(INACTIVE)).toEqual({ allowed: true, nextStatus: 'ACTIVA' });
});

describe('Transiciones no definidas', () => {
  it.each([
    ['ACTIVA → ACTIVA', ACTIVE, COHORT_TRANSITION.ACTIVATE],
    ['BORRADOR → INACTIVA', DRAFT, COHORT_TRANSITION.INACTIVATE],
    ['INACTIVA → INACTIVA', INACTIVE, COHORT_TRANSITION.INACTIVATE],
    ['transición desconocida', DRAFT, 'REVERT_TO_DRAFT'],
    ['sin cohorte', null, COHORT_TRANSITION.ACTIVATE],
  ])('%s se rechaza', (_, cohort, transition) => {
    expect(evaluate(cohort, transition)).toEqual({
      allowed: false,
      reason: TRANSITION_REJECTION.NOT_ALLOWED,
      message: 'La cohorte ya no está en un estado que permita esta acción.',
    });
  });

  it('no modifica la cohorte evaluada', () => {
    const cohort = { ...DRAFT };
    evaluate(cohort);
    expect(cohort).toEqual(DRAFT);
  });
});
