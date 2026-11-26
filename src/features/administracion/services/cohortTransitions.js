import { COHORT_STATUS } from '../types/cohortStatus.js';

import { validateCohortForm, validateCohortSchedule } from './cohortValidation.js';

/*
 * RF-124. La interfaz ofrece las transiciones admitidas por el backend.
 * La regla del cronograma activo también aplica a la reactivación.
 */
export const COHORT_TRANSITION = Object.freeze({
  ACTIVATE: 'ACTIVATE',
  INACTIVATE: 'INACTIVATE',
});

const TRANSITIONS = Object.freeze({
  [COHORT_TRANSITION.ACTIVATE]: Object.freeze({
    from: Object.freeze([COHORT_STATUS.DRAFT, COHORT_STATUS.INACTIVE]), to: COHORT_STATUS.ACTIVE,
  }),
  [COHORT_TRANSITION.INACTIVATE]: Object.freeze({
    from: Object.freeze([COHORT_STATUS.ACTIVE]), to: COHORT_STATUS.INACTIVE,
  }),
});

export const TRANSITION_REJECTION = Object.freeze({
  NOT_ALLOWED: 'NOT_ALLOWED',
  INCOMPLETE_DATA: 'INCOMPLETE_DATA',
  NO_SCHEDULE: 'NO_SCHEDULE',
  SCHEDULE_NOT_ACTIVE: 'SCHEDULE_NOT_ACTIVE',
});

const REJECTION_MESSAGE = Object.freeze({
  [TRANSITION_REJECTION.NOT_ALLOWED]:
    'La cohorte ya no está en un estado que permita esta acción.',
  [TRANSITION_REJECTION.INCOMPLETE_DATA]:
    'No es posible activar la cohorte porque su nombre o su periodo del programa no son válidos. Corrígelos desde «Editar».',
  [TRANSITION_REJECTION.NO_SCHEDULE]:
    'No es posible activar la cohorte porque no tiene un cronograma asociado.',
  [TRANSITION_REJECTION.SCHEDULE_NOT_ACTIVE]:
    'No es posible activar la cohorte porque el cronograma asociado no está activo.',
});

const reject = (reason) => Object.freeze({ allowed: false, reason, message: REJECTION_MESSAGE[reason] });

// Transiciones que el estado actual admite (sin validar los datos).
export function getAvailableTransitions(cohort) {
  return Object.entries(TRANSITIONS)
    .filter(([, { from }]) => from.includes(cohort?.status))
    .map(([transition]) => transition);
}

/*
 * ¿Puede aplicarse la transición ahora? Devuelve
 * { allowed: true, nextStatus } o { allowed: false, reason, message }.
 */
export function evaluateCohortTransition(cohort, transition, schedules = []) {
  const definition = TRANSITIONS[transition];

  if (!definition || !definition.from.includes(cohort?.status)) {
    return reject(TRANSITION_REJECTION.NOT_ALLOWED);
  }

  if (transition === COHORT_TRANSITION.ACTIVATE) {
    if (Object.keys(validateCohortForm(cohort)).length > 0) {
      return reject(TRANSITION_REJECTION.INCOMPLETE_DATA);
    }

    if (!cohort.scheduleId) return reject(TRANSITION_REJECTION.NO_SCHEDULE);

    if (validateCohortSchedule(cohort.scheduleId, schedules).scheduleId) {
      return reject(TRANSITION_REJECTION.SCHEDULE_NOT_ACTIVE);
    }
  }

  return Object.freeze({ allowed: true, nextStatus: definition.to });
}
