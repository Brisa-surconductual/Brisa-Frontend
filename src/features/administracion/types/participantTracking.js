/*
 * Seguimiento de participantes: listado por cohorte (RF-142), ficha
 * individual (RF-128) y secciones de la ficha.
 *
 * El listado y la ficha siguen el contrato real del backend
 * (`GET /admin/cohortes/:id/participantes/indicadores` y
 * `GET /admin/participantes/:codigo/perfil-seguimiento`). Las secciones
 * de la ficha (RF-129 a RF-131 y M04) siguen con su forma PROVISIONAL,
 * solo en la demostración. Los indicadores provienen del módulo de
 * seguimiento (M05); no son los estados de elegibilidad de RF-125.
 */

// Origen del listado y de la ficha.
export const TRACKING_SOURCE_MODE = Object.freeze({
  API: 'API',
  DEMO: 'DEMO',
});

/*
 * Autorización explícita PROVISIONAL de las secciones de la ficha que aún
 * no están integradas (RF-129 a RF-131, M04). No se aplica al listado ni
 * a la ficha: en el backend real la autorización la deciden sus guardas,
 * y una respuesta 200 no lleva un campo de acceso.
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
  // RF-130: segundo 403, «se requiere permiso explícito».
  EXPLICIT_PERMISSION_REQUIRED: 'PERMISO_EXPLICITO_REQUERIDO',
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
  PENDING: 'PENDIENTE',
  IN_REVIEW: 'EN_REVISION',
  RESOLVED: 'RESUELTA',
  DISMISSED: 'DESCARTADA',
  // Atendida desde la gestión administrativa (RF-147).
  ATTENDED: 'ATENDIDA',
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
  // RF-149: degradado sin fecha confiable del último dato.
  STALE_UNDATED: 'STALE_UNDATED',
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

// Niveles de progreso de M05 (RF-70), en su orden canónico.
export const PROGRESS_LEVELS = Object.freeze(['INICIAL', 'EN_AVANCE', 'AVANZADO', 'COMPLETADO']);

// Modo de consulta que declara la ficha real (RF-128).
export const READ_ONLY_MODE = 'SOLO_LECTURA';

// Resultado de interpretar la respuesta de la ficha (RF-128).
export const PROFILE_OUTCOME = Object.freeze({
  OK: 'OK',
  // 204: M05 no tiene perfil del participante.
  NO_PROFILE: 'NO_PROFILE',
  // El perfil declara otro participante que el pedido.
  INCONSISTENT: 'INCONSISTENT',
  // La respuesta no cumple el contrato.
  INVALID: 'INVALID',
});

// Resultado de interpretar una página del listado (RF-142).
export const TRACKING_OUTCOME = Object.freeze({
  OK: 'OK',
  INVALID: 'INVALID',
});

// Campos de orden del listado (`orden_campo`).
export const TRACKING_SORT_FIELD = Object.freeze({
  CODE: 'codigo_participante',
  PROGRESS: 'nivel_progreso',
  ADHERENCE: 'tasa_adherencia',
  ACTIVE_ALERTS: 'alertas_activas',
  ATTENDED_ALERTS: 'alertas_atendidas',
});

// Dirección del orden (`orden_direccion`).
export const SORT_DIRECTION = Object.freeze({
  ASC: 'ASC',
  DESC: 'DESC',
});

// Filtro por alertas activas sin atender (`con_alertas`).
export const TRACKING_ALERT_FILTER = Object.freeze({
  WITH_ALERTS: 'true',
  WITHOUT_ALERTS: 'false',
});

// Umbrales de adherencia que ofrecen los filtros, en %. Se envían como
// fracción entre 0 y 1 (`adherencia_min`, `adherencia_max`).
export const TRACKING_THRESHOLDS = Object.freeze([25, 50, 75]);

// Registros por página: el predeterminado del backend (máximo 100).
export const TRACKING_PAGE_SIZE = 20;
