/*
 * Fuente de la consulta temporal del participante (M04) en la ficha.
 * Separada de las demás: tiene su propia autorización explícita.
 *
 * Hoy solo existe la demostración de desarrollo; el modo de la ficha
 * (data/trackingSource, getTrackingSourceMode) decide si se consulta.
 * Al autorizarse la integración, la función delegará en un adaptador de
 * `api/` con la misma firma. PENDIENTE de confirmar con el backend: el
 * endpoint administrativo (M04 hoy expone la información temporal por
 * identificador interno, que el M08 no usa), la forma de la respuesta,
 * su autorización explícita y sus códigos de error. Un error nunca se
 * responderá con datos ficticios.
 */
const NOT_INTEGRATED = 'La consulta temporal del participante aún no está integrada.';

/*
 * Único punto que carga esta demostración. El import dinámico está
 * dentro de la condición del M08: en producción la rama se elimina y
 * ningún dato ni escenario ficticio llega al build.
 */
async function loadTemporalDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./temporalLocationDemoSource.js');
}

/*
 * Devuelve { access, cohortId, reference, temporal } o rechaza con
 * `error.code` (TRACKING_QUERY_ERROR).
 */
export async function getParticipantTemporalLocation(cohortId, reference) {
  return (await loadTemporalDemoSource()).getParticipantTemporalLocation(cohortId, reference);
}
