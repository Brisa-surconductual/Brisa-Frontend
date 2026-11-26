// Vista agregada conductual de una cohorte (RF-132, datos de M05 conforme
// a RF-78).

// `estado` de la respuesta.
export const AGGREGATE_VIEW_STATE = Object.freeze({
  AVAILABLE: 'DISPONIBLE',
  STALE: 'DESACTUALIZADA',
  NOT_AVAILABLE: 'NO_DISPONIBLE',
});

// `estado_agregacion` de la respuesta.
export const AGGREGATION_STATE = Object.freeze({
  UPDATED: 'ACTUALIZADO',
  PENDING: 'PENDIENTE',
  UPDATE_ERROR: 'ERROR_ACTUALIZACION',
});

// `motivo_sin_datos` de la respuesta.
export const NO_DATA_REASON = Object.freeze({
  NOT_CONSOLIDATED: 'SIN_CONSOLIDAR',
  SUPPRESSED: 'AGREGADO_SUPRIMIDO',
});

// Niveles de progreso de RF-70, en el orden en que se presentan.
export const PROGRESS_LEVEL = Object.freeze({
  INITIAL: 'INICIAL',
  IN_PROGRESS: 'EN_AVANCE',
  ADVANCED: 'AVANZADO',
  COMPLETED: 'COMPLETADO',
});

// Situación de la vista para la interfaz (resultado de interpretar la
// respuesta o el error de la fuente).
export const AGGREGATE_VIEW_STATUS = Object.freeze({
  READY: 'READY',
  STALE: 'STALE',
  NOT_CONSOLIDATED: 'NOT_CONSOLIDATED',
  SUPPRESSED: 'SUPPRESSED',
  UNAVAILABLE: 'UNAVAILABLE',
  INCONSISTENT: 'INCONSISTENT',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
});

// Códigos con los que la fuente rechaza la consulta.
export const AGGREGATE_QUERY_ERROR = Object.freeze({
  COHORT_NOT_FOUND: 'COHORT_NOT_FOUND',
});

// Origen de los datos que ve la interfaz.
export const AGGREGATE_SOURCE_MODE = Object.freeze({
  API: 'API',
  DEMO: 'DEMO',
  PENDING_INTEGRATION: 'PENDING_INTEGRATION',
});
