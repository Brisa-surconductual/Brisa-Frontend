import { TRACKING_SOURCE_MODE } from '../types/participantTracking.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente de indicadores de seguimiento por cohorte (RF-142) que consume
 * el hook. Separada de la elegibilidad (RF-125) y de la auditoría.
 *
 * Hoy solo existe la demostración de desarrollo; sin ella el modo es
 * PENDING_INTEGRATION y no se consulta nada. Al autorizarse la
 * integración, `listCohortTracking` delegará en un adaptador de `api/`
 * con la misma firma. PENDIENTE de confirmar con el backend:
 *   - ruta y nombres de parámetros (RF-142 sugiere id_cohorte,
 *     filtro_indicador, valor_filtro, orden_campo, paginacion_offset,
 *     paginacion_limit);
 *   - forma de la respuesta y del campo de autorización explícita;
 *   - códigos de error (403, 404) y su forma.
 * Un error nunca se responderá con datos ficticios.
 */
const NOT_INTEGRATED = 'La consulta de seguimiento aún no está integrada.';

/*
 * Único punto que carga la demostración de seguimiento. El import
 * dinámico está dentro de la condición del M08: en producción la rama
 * se elimina y ningún indicador ni escenario ficticio llega al build.
 */
async function loadTrackingDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./trackingDemoSource.js');
}

export function getTrackingSourceMode() {
  return isCohortDemoEnabled()
    ? TRACKING_SOURCE_MODE.DEMO
    : TRACKING_SOURCE_MODE.PENDING_INTEGRATION;
}

/*
 * `query`: { filters, sort, offset, limit } normalizado
 * (services/trackingQuery.js). Devuelve la página con su autorización
 * explícita, o rechaza con `error.code` (TRACKING_QUERY_ERROR).
 */
export async function listCohortTracking(cohortId, query) {
  return (await loadTrackingDemoSource()).listCohortTracking(cohortId, query);
}

/*
 * Ficha individual de seguimiento (RF-128). Devuelve el perfil con su
 * autorización explícita, su cohorte y su referencia (para comprobar el
 * aislamiento), o rechaza con `error.code` (TRACKING_QUERY_ERROR).
 * PENDIENTE de confirmar con el backend: ruta, forma de la respuesta y
 * de cada indicador, y cómo se traduce el 204 (sin cuerpo) a un
 * resultado sin perfil.
 */
export async function getParticipantTrackingProfile(cohortId, reference) {
  return (await loadTrackingDemoSource()).getParticipantTrackingProfile(cohortId, reference);
}

/*
 * Historial de alertas del participante (RF-129). Consulta propia, con
 * su propia autorización explícita: la de la ficha no la implica.
 * Devuelve { access, cohortId, reference, alerts } o rechaza con
 * `error.code` (TRACKING_QUERY_ERROR). PENDIENTE de confirmar con el
 * backend: ruta, si llega en la misma respuesta que la ficha o aparte,
 * la forma de cada alerta (¿declara el participante?), el permiso que
 * exige, el sentido del orden y cómo se traduce el 204 (sin cuerpo).
 */
export async function getParticipantAlertHistory(cohortId, reference) {
  return (await loadTrackingDemoSource()).getParticipantAlertHistory(cohortId, reference);
}
