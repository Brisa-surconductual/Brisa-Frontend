import { COHORT_SOURCE_MODE } from '../types/cohortSourceMode.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente de datos de cohortes y cronogramas que consumen los hooks.
 *
 * Hoy solo existe la fuente de demostración de desarrollo. Sin ella,
 * el modo es PENDING_INTEGRATION: no se consulta ni se guarda nada,
 * porque el M08 aún no está conectado al servidor. Al autorizarse la
 * integración, estas funciones delegarán en adaptadores de `api/` con
 * la misma firma; un error real nunca se responderá con datos ficticios.
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
    : COHORT_SOURCE_MODE.PENDING_INTEGRATION;
}

export async function listCohorts() {
  return (await loadDemoSource()).listCohorts();
}

// Cohorte por identificador, o null si no existe.
export async function getCohort(id) {
  return (await loadDemoSource()).getCohort(id);
}

// Catálogo de cronogramas para asociar a una cohorte.
export async function listSchedules() {
  return (await loadDemoSource()).listSchedules();
}

// `values`: { name, startDate, endDate, scheduleId } ya validados.
export async function createCohort(values) {
  return (await loadDemoSource()).createCohort(values);
}

// Devuelve la cohorte actualizada, o null si ya no existe.
export async function updateCohort(id, values) {
  return (await loadDemoSource()).updateCohort(id, values);
}

/*
 * Cambio de estado (RF-124): `transition` es COHORT_TRANSITION.
 * Devuelve { ok: true, cohort } o { ok: false, reason, message, cohort }
 * si la transición ya no es válida; un fallo de la fuente rechaza la
 * promesa y no cambia nada.
 */
export async function changeCohortStatus(id, transition) {
  return (await loadDemoSource()).changeCohortStatus(id, transition);
}
