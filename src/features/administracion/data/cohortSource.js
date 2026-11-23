import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';
import * as api from '../api/cohortesApi.js';

/*
 * Fuente de datos de cohortes y cronogramas que consumen los hooks.
 *
 * La API es la fuente de RF-124. La demostración se activa explícitamente
 * en desarrollo y mantiene su propio estado.
 */
const NOT_INTEGRATED = 'La gestión de cohortes aún no está integrada.';

/*
 * Único punto que carga la demostración (también lo usa la fuente de
 * participantes). El import dinámico está dentro de la condición: en
 * producción la rama se elimina y ningún dato, escenario ni almacén de
 * demostración llega al build.
 */
export async function loadDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./cohortDemoSource.js');
}

export function getCohortSourceMode() {
  return isCohortDemoEnabled()
    ? COHORT_SOURCE_MODE.DEMO
    : COHORT_SOURCE_MODE.API;
}

function cohortSource() {
  return isCohortDemoEnabled() ? loadDemoSource() : api;
}

export async function listCohorts() {
  return (await cohortSource()).listCohorts();
}

// Cohorte por identificador, o null si no existe.
export async function getCohort(id) {
  return (await cohortSource()).getCohort(id);
}

// Catálogo de cronogramas para asociar a una cohorte.
export async function listSchedules() {
  return (await cohortSource()).listSchedules();
}

// `values`: { name, startDate, endDate, scheduleId } ya validados.
export async function createCohort(values) {
  return (await cohortSource()).createCohort(values);
}

// Devuelve la cohorte actualizada, o null si ya no existe.
export async function updateCohort(id, values) {
  return (await cohortSource()).updateCohort(id, values);
}

/*
 * Cambio de estado (RF-124): `transition` es COHORT_TRANSITION.
 * Devuelve { ok: true, cohort } o { ok: false, reason, message, cohort }
 * si la transición ya no es válida; un fallo de la fuente rechaza la
 * promesa y no cambia nada.
 */
export async function changeCohortStatus(id, transition) {
  return (await cohortSource()).changeCohortStatus(id, transition);
}
