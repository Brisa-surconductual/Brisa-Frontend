/*
 * Consultas de la ficha sobre M06 (progresión narrativa, RF-130) y M07
 * (interacción con notificaciones, RF-131). Constantes PROVISIONALES de
 * la interfaz, pendientes del contrato del backend.
 */

/*
 * Resultado de interpretar la respuesta de una sección. Equivalencias
 * documentales: EMPTY 204, DENIED 403, INCONSISTENT 409.
 */
export const SECTION_OUTCOME = Object.freeze({
  OK: 'OK',
  EMPTY: 'EMPTY',
  DENIED: 'DENIED',
  INCONSISTENT: 'INCONSISTENT',
  MALFORMED: 'MALFORMED',
});

/*
 * Situación de una sección de la ficha. Equivalencias con RF-130 y
 * RF-131: EMPTY 204, DENIED 403, PERMISSION_REQUIRED 403 (permiso
 * explícito, RF-130), NOT_FOUND 404, INCONSISTENT 409, UNAVAILABLE 503,
 * ERROR 500. OUTSIDE_COHORT y COHORT_NOT_FOUND no tienen código en esos
 * requerimientos (decisión provisional de la interfaz).
 */
export const SECTION_STATUS = Object.freeze({
  READY: 'READY',
  EMPTY: 'EMPTY',
  DENIED: 'DENIED',
  PERMISSION_REQUIRED: 'PERMISSION_REQUIRED',
  NOT_FOUND: 'NOT_FOUND',
  COHORT_NOT_FOUND: 'COHORT_NOT_FOUND',
  OUTSIDE_COHORT: 'OUTSIDE_COHORT',
  INCONSISTENT: 'INCONSISTENT',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR',
});

/*
 * Métricas de interacción con notificaciones (RF-131, expuestas por M07
 * conforme a RF-98). Los totales son enteros; las tasas son números
 * (float) cuya escala no define RF-131: se muestran tal como llegan.
 */
export const NOTIFICATION_COUNT_FIELDS = Object.freeze([
  'sent',
  'delivered',
  'opened',
  'dismissed',
  'sessionsFromNotification',
]);

export const NOTIFICATION_RATE_FIELDS = Object.freeze([
  'openRate',
  'conversionRate',
  'dismissalRate',
]);
