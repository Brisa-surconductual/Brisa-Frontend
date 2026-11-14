/*
 * Consulta de indicadores de seguimiento por cohorte (RF-142).
 *
 * Constantes PROVISIONALES de la interfaz: los valores, nombres de
 * parámetros y códigos definitivos deben confirmarse con el backend.
 * Los indicadores provienen del módulo de seguimiento (M05, RF-77);
 * no son los estados de elegibilidad de RF-125.
 */

// Origen de los indicadores que ve la interfaz.
export const TRACKING_SOURCE_MODE = Object.freeze({
  DEMO: 'DEMO',
  PENDING_INTEGRATION: 'PENDING_INTEGRATION',
});

/*
 * Autorización explícita que debe incluir cada respuesta. El rol
 * ADMINISTRATIVO no basta para ver información individual (RF-04 frente
 * a RF-142): solo AUTORIZADO permite mostrar registros; cualquier otro
 * valor, o su ausencia, se trata como denegado.
 */
export const TRACKING_ACCESS = Object.freeze({
  GRANTED: 'AUTORIZADO',
  DENIED: 'DENEGADO',
});

// Códigos estructurados con los que la fuente rechaza la consulta.
export const TRACKING_QUERY_ERROR = Object.freeze({
  ACCESS_DENIED: 'ACCESO_DENEGADO',
  COHORT_NOT_FOUND: 'COHORTE_NO_ENCONTRADA',
});

// Resultado de interpretar una respuesta (services/trackingResponse.js).
export const TRACKING_OUTCOME = Object.freeze({
  OK: 'OK',
  DENIED: 'DENIED',
  INCONSISTENT: 'INCONSISTENT',
});

// Indicadores por los que RF-142 permite ordenar.
export const TRACKING_SORT_FIELD = Object.freeze({
  PROGRESS: 'progreso',
  ADHERENCE: 'adherencia',
  ACTIVE_ALERTS: 'alertas',
});

export const SORT_DIRECTION = Object.freeze({
  ASC: 'asc',
  DESC: 'desc',
});

// Filtro por alertas activas.
export const TRACKING_ALERT_FILTER = Object.freeze({
  WITH_ALERTS: 'con-alertas',
  WITHOUT_ALERTS: 'sin-alertas',
});

// Umbrales mínimos (en %) para filtrar progreso y adherencia.
export const TRACKING_THRESHOLDS = Object.freeze([25, 50, 75]);

// Registros por página (paginación por offset y limit). PROVISIONAL.
export const TRACKING_PAGE_SIZE = 5;
