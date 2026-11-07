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
