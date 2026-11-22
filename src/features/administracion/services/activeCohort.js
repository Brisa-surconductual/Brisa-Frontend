import { ACTIVE_COHORT_RESULT } from '../types/cohortDashboard.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';

/*
 * Identifica la cohorte activa del panel (RF-140, mediante RF-124). Pura.
 * Solo una cohorte en estado ACTIVA cuenta: nunca se toma una BORRADOR o
 * INACTIVA para llenar el panel.
 *
 * RF-124 no define qué hacer si hay varias cohortes activas: en ese caso
 * no se elige ninguna (MULTIPLE) y la interfaz lo informa, en lugar de
 * escoger una de forma arbitraria. PENDIENTE de regla oficial.
 */
export function findActiveCohort(cohorts) {
  const active = Array.isArray(cohorts)
    ? cohorts.filter(
        (cohort) =>
          cohort?.status === COHORT_STATUS.ACTIVE &&
          typeof cohort.id === 'string' &&
          cohort.id.trim() !== '',
      )
    : [];

  if (active.length === 0) {
    return Object.freeze({
      result: ACTIVE_COHORT_RESULT.NONE,
      cohort: null,
      activeCohorts: Object.freeze([]),
    });
  }

  if (active.length > 1) {
    return Object.freeze({
      result: ACTIVE_COHORT_RESULT.MULTIPLE,
      cohort: null,
      activeCohorts: Object.freeze(active),
    });
  }

  return Object.freeze({
    result: ACTIVE_COHORT_RESULT.FOUND,
    cohort: active[0],
    activeCohorts: Object.freeze(active),
  });
}
