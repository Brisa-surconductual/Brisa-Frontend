/*
 * Fuente de las secciones de la ficha que consultan M06 (progresión
 * narrativa, RF-130) y M07 (interacción con notificaciones, RF-131).
 * Separadas entre sí y de la fuente de seguimiento: cada consulta tiene
 * su propia autorización explícita.
 *
 * Hoy solo existe la demostración de desarrollo; el modo de la ficha
 * (data/trackingSource, getTrackingSourceMode) decide si se consulta.
 * Al autorizarse la integración, estas funciones delegarán en
 * adaptadores de `api/` con la misma firma. PENDIENTE de confirmar con
 * el backend: rutas, forma de las respuestas, campo de autorización
 * explícita de cada consulta, códigos de error y traducción del 204.
 * Un error nunca se responderá con datos ficticios.
 */
const NOT_INTEGRATED = 'La consulta de gamificación y notificaciones aún no está integrada.';

/*
 * Único punto que carga esta demostración. El import dinámico está
 * dentro de la condición del M08: en producción la rama se elimina y
 * ningún dato ni escenario ficticio llega al build.
 */
async function loadEngagementDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./engagementDemoSource.js');
}

/*
 * Progresión narrativa (RF-130). Devuelve { access, cohortId, reference,
 * narrative } o rechaza con `error.code` (TRACKING_QUERY_ERROR).
 */
export async function getParticipantNarrativeProgress(cohortId, reference) {
  return (await loadEngagementDemoSource()).getParticipantNarrativeProgress(cohortId, reference);
}

/*
 * Interacción con notificaciones (RF-131). Devuelve { access, cohortId,
 * reference, metrics } o rechaza con `error.code` (TRACKING_QUERY_ERROR).
 */
export async function getParticipantNotificationInteraction(cohortId, reference) {
  return (await loadEngagementDemoSource()).getParticipantNotificationInteraction(cohortId, reference);
}
