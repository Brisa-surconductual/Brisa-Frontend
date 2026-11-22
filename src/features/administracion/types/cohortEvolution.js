// Evolución temporal de indicadores de la cohorte por unidad del
// cronograma (RF-141 v1.0.1, datos de M05 vía RF-78 segmentados por
// RF-55). Los niveles de progreso son los de RF-70
// (types/behavioralAggregate.js: PROGRESS_LEVEL).

// Situación de la vista para la interfaz.
export const EVOLUTION_STATUS = Object.freeze({
  // Dos o más unidades y al menos una con datos.
  READY: 'READY',
  // Menos de dos unidades transcurridas: estado funcional (HTTP 200).
  INSUFFICIENT_UNITS: 'INSUFFICIENT_UNITS',
  // Ninguna unidad de la serie tiene datos consolidados.
  NO_DATA: 'NO_DATA',
  // Con filtros de RF-135 aplicados, ninguna unidad tiene datos.
  NO_FILTER_RESULTS: 'NO_FILTER_RESULTS',
  // Cohorte activa inexistente (404).
  NOT_FOUND: 'NOT_FOUND',
  // Sin permisos (403).
  FORBIDDEN: 'FORBIDDEN',
  // M05 no disponible (503): nunca una serie parcial.
  UNAVAILABLE: 'UNAVAILABLE',
  // No fue posible construir una serie coherente (500).
  ERROR: 'ERROR',
});

// Códigos con los que la fuente rechaza la consulta.
export const EVOLUTION_QUERY_ERROR = Object.freeze({
  COHORT_NOT_FOUND: 'COHORT_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  SOURCE_UNAVAILABLE: 'M05_UNAVAILABLE',
  BUILD_ERROR: 'SERIES_BUILD_ERROR',
});

// RF-141: la evolución requiere al menos dos unidades transcurridas.
export const EVOLUTION_MIN_UNITS = 2;

/*
 * Tiempo límite de cada consulta de la vista: el mismo criterio que el
 * panel principal (types/cohortDashboard.js), porque RF-141 no fija uno.
 * Superarlo equivale a que M05 no responde (503).
 */
export const EVOLUTION_QUERY_TIMEOUT_MS = 8000;
