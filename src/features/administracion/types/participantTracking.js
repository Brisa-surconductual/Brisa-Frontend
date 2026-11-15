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

/*
 * Códigos estructurados con los que la fuente rechaza la consulta. Los
 * de la ficha (RF-128) equivalen a los casos documentados: 404
 * participante, 503 M05 no disponible. FUERA_DE_COHORTE no tiene código
 * HTTP en RF-128: es una decisión provisional de la interfaz.
 */
export const TRACKING_QUERY_ERROR = Object.freeze({
  ACCESS_DENIED: 'ACCESO_DENEGADO',
  COHORT_NOT_FOUND: 'COHORTE_NO_ENCONTRADA',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANTE_NO_ENCONTRADO',
  OUTSIDE_COHORT: 'PARTICIPANTE_FUERA_DE_COHORTE',
  MODULE_UNAVAILABLE: 'MODULO_NO_DISPONIBLE',
});

/*
 * Tendencia de consumo (RF-128, tendencia_consumo; definiciones en
 * RF-73). PENDIENTE: RF-69 usa otro enumerado (ESTABILIZACION,
 * NO_CALCULABLE); un valor fuera de esta lista se muestra tal cual.
 */
export const TRACKING_TREND = Object.freeze({
  REDUCTION: 'REDUCCION',
  STABLE: 'ESTABLE',
  INCREASE: 'INCREMENTO',
  NOT_CALCULATED: 'NO_CALCULADA',
});

// Tipos de alerta activa (RF-129: RF-63 craving elevado, RF-68 inactividad).
export const TRACKING_ALERT_TYPE = Object.freeze({
  HIGH_CRAVING: 'CRAVING_ELEVADO',
  INACTIVITY: 'INACTIVIDAD',
});

// Requerimiento fuente de cada alerta (RF-129, fuente_alerta).
export const TRACKING_ALERT_SOURCE = Object.freeze({
  HIGH_CRAVING: 'RF-63',
  INACTIVITY: 'RF-68',
});

/*
 * Estado de resolución de una alerta (RF-129, estado_resolucion). El
 * M08 solo lo consulta: no define transiciones ni lo modifica. Solo
 * ACTIVA cuenta como alerta activa en el resumen de RF-128; EN_REVISION
 * no se cuenta (PENDIENTE de confirmar con el backend).
 */
export const ALERT_RESOLUTION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVA',
  IN_REVIEW: 'EN_REVISION',
  RESOLVED: 'RESUELTA',
  DISMISSED: 'DESCARTADA',
});

// Resultado de interpretar la respuesta del historial (RF-129).
export const ALERT_HISTORY_OUTCOME = Object.freeze({
  OK: 'OK',
  EMPTY: 'EMPTY',
  DENIED: 'DENIED',
  INCONSISTENT: 'INCONSISTENT',
  MALFORMED: 'MALFORMED',
});

/*
 * Situación de la sección de historial. Equivalencias documentales con
 * RF-129: EMPTY 204, DENIED 403, NOT_FOUND 404, INCONSISTENT 409,
 * UNAVAILABLE 503, ERROR 500. OUTSIDE_COHORT y COHORT_NOT_FOUND no
 * tienen código en RF-129 (decisión provisional de la interfaz).
 */
export const ALERT_HISTORY_STATUS = Object.freeze({
  READY: 'READY',
  EMPTY: 'EMPTY',
  DENIED: 'DENIED',
  NOT_FOUND: 'NOT_FOUND',
  COHORT_NOT_FOUND: 'COHORT_NOT_FOUND',
  OUTSIDE_COHORT: 'OUTSIDE_COHORT',
  INCONSISTENT: 'INCONSISTENT',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR',
});

// Marca de un indicador que M05 no pudo calcular (RF-67, RF-131).
export const NOT_CALCULABLE = 'NO_CALCULABLE';

// Situación de un indicador de la ficha.
export const INDICATOR_STATE = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  NOT_CALCULABLE: 'NOT_CALCULABLE',
});

// Resultado de interpretar la respuesta de la ficha (RF-128).
export const PROFILE_OUTCOME = Object.freeze({
  OK: 'OK',
  NO_PROFILE: 'NO_PROFILE',
  DENIED: 'DENIED',
  INCONSISTENT: 'INCONSISTENT',
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
