// Rutas del área de cohortes usadas para enlazar sus páginas.
export const COHORTS_PATH = '/app/administrativo/cohortes';

export function getCohortDetailPath(cohortId) {
  return `${COHORTS_PATH}/${encodeURIComponent(cohortId)}`;
}

// Seguimiento por cohorte (RF-142). Solo lleva el identificador de la
// cohorte: ningún dato de participantes viaja en la URL.
export function getCohortTrackingPath(cohortId) {
  return `${getCohortDetailPath(cohortId)}/seguimiento`;
}

// Vista agregada conductual (RF-132). Solo lleva el identificador de la
// cohorte y no enlaza a ningún participante.
export function getCohortAggregatePath(cohortId) {
  return `${getCohortDetailPath(cohortId)}/vista-agregada`;
}

// Vista agregada de progresión narrativa (RF-133). Solo lleva el
// identificador de la cohorte y no enlaza a ningún participante.
export function getCohortNarrativePath(cohortId) {
  return `${getCohortDetailPath(cohortId)}/vista-narrativa`;
}

// Vista agregada de efectividad de notificaciones (RF-134). Solo lleva
// el identificador de la cohorte y no enlaza a ningún participante.
export function getCohortNotificationsPath(cohortId) {
  return `${getCohortDetailPath(cohortId)}/vista-notificaciones`;
}

// Evolución temporal de indicadores (RF-141). Solo lleva el
// identificador de la cohorte y no enlaza a ningún participante.
export function getCohortEvolutionPath(cohortId) {
  return `${getCohortDetailPath(cohortId)}/evolucion`;
}

// Bandeja de alertas pendientes (RF-146) y su atención (RF-147). Solo
// lleva el identificador de la cohorte.
export function getCohortPendingAlertsPath(cohortId) {
  return `${getCohortDetailPath(cohortId)}/alertas/pendientes`;
}

// Ficha individual (RF-128). `reference` es la referencia OPACA que da la
// fuente: nunca un correo, documento, nombre ni UUID interno.
export function getParticipantTrackingPath(cohortId, reference) {
  return `${getCohortTrackingPath(cohortId)}/${encodeURIComponent(reference)}`;
}
