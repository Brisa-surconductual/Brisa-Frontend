import { loadDemoSource } from './cohortSource.js';

/*
 * Fuente de participantes de cohorte (RF-125) que consumen los hooks.
 *
 * Hoy solo existe la demostración de desarrollo, cargada por el mismo
 * punto que la de cohortes; sin ella la consulta se rechaza, porque el
 * M08 aún no está integrado. Al autorizarse la integración, esta
 * función delegará en un adaptador de `api/` con la misma firma, sin
 * cambiar la página. No usa GET /usuarios/buscar: esa respuesta no
 * corresponde a la presentación seudonimizada de RF-125.
 *
 * Devuelve la lista de participantes de la cohorte, o null si la
 * cohorte no existe. Un error nunca se responde con datos ficticios.
 */
export async function listCohortParticipants(cohortId) {
  return (await loadDemoSource()).listCohortParticipants(cohortId);
}

/*
 * Participantes que pueden proponerse para la cohorte (RF-125):
 * [{ id, code, issue }], con `issue` null o un ASSIGNMENT_ISSUE que
 * decide la fuente; null si la cohorte no existe. Solo códigos
 * seudonimizados: ningún dato personal.
 */
export async function listAvailableParticipants(cohortId) {
  return (await loadDemoSource()).listAvailableParticipants(cohortId);
}

/*
 * Asigna los participantes a la cohorte. Devuelve { ok: true, assigned }
 * con el estado que decidió la fuente para cada uno, o
 * { ok: false, error, issues } sin asignar ninguno (operación atómica,
 * PROVISIONAL). Un fallo de la fuente rechaza la promesa.
 */
export async function assignParticipants(cohortId, participantIds) {
  return (await loadDemoSource()).assignParticipants(cohortId, participantIds);
}

/*
 * Retira al participante de la cohorte (RF-125). Semántica PROVISIONAL:
 * solo elimina la asociación; no borra al participante ni cambia sus
 * estados ni otras cohortes. Devuelve { ok: true, removed } o
 * { ok: false, error } (REMOVAL_ERROR) sin cambios. Un fallo de la
 * fuente rechaza la promesa.
 */
export async function removeCohortParticipant(cohortId, participantId) {
  return (await loadDemoSource()).removeCohortParticipant(cohortId, participantId);
}
