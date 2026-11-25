// Panel principal del módulo administrativo (RF-140): orquestación de
// las vistas agregadas de la cohorte activa (RF-132, RF-133, RF-134).

// Secciones del panel, con los nombres del contrato lógico de RF-140.
export const DASHBOARD_SECTION = Object.freeze({
  BEHAVIORAL: 'vista_conductual',
  NARRATIVE: 'vista_narrativa',
  NOTIFICATIONS: 'vista_notificaciones',
});

// Orden de prioridad de RF-140: conducta, narrativa, notificaciones.
export const DASHBOARD_SECTIONS = Object.freeze([
  DASHBOARD_SECTION.BEHAVIORAL,
  DASHBOARD_SECTION.NARRATIVE,
  DASHBOARD_SECTION.NOTIFICATIONS,
]);

// estado_disponibilidad_vista de RF-140.
export const VIEW_AVAILABILITY = Object.freeze({
  AVAILABLE: 'DISPONIBLE',
  STALE: 'DESACTUALIZADA',
  NOT_AVAILABLE: 'NO_DISPONIBLE',
});

/*
 * Cómo terminó la consulta de una sección:
 * - RESPONDED: la fuente respondió (con datos, sin consolidar,
 *   desactualizada o no disponible, según su propio contrato);
 * - REJECTED: la consulta falló;
 * - TIMEOUT: la fuente no respondió dentro del tiempo límite;
 * - CACHED: ninguna fuente respondió y se muestra la última vista
 *   válida conservada en memoria para esa cohorte.
 */
export const SECTION_OUTCOME = Object.freeze({
  RESPONDED: 'RESPONDED',
  REJECTED: 'REJECTED',
  TIMEOUT: 'TIMEOUT',
  CACHED: 'CACHED',
});

// Resultado de identificar la cohorte activa (RF-124).
export const ACTIVE_COHORT_RESULT = Object.freeze({
  FOUND: 'FOUND',
  NONE: 'NONE',
  MULTIPLE: 'MULTIPLE',
});

// Situación general del panel.
export const DASHBOARD_STATUS = Object.freeze({
  LOADING: 'LOADING',
  COHORTS_ERROR: 'COHORTS_ERROR',
  PANEL_ERROR: 'PANEL_ERROR',
  ACCESS_DENIED: 'ACCESS_DENIED',
  NO_ACTIVE_COHORT: 'NO_ACTIVE_COHORT',
  MULTIPLE_ACTIVE_COHORTS: 'MULTIPLE_ACTIVE_COHORTS',
  READY: 'READY',
});

// Origen del panel ensamblado.
export const PANEL_SOURCE = Object.freeze({
  // Al menos una fuente respondió.
  LIVE: 'LIVE',
  // Ninguna respondió; se muestra la última versión conservada.
  CACHED: 'CACHED',
  // Ninguna respondió y no hay versión conservada.
  UNAVAILABLE: 'UNAVAILABLE',
});

/*
 * Tiempo límite de cada consulta del panel. RF-140 no fija un valor y
 * el frontend no tenía una convención de timeout para consultas (solo
 * la de sesión): 8 s deja margen amplio sobre la demora simulada de las
 * fuentes (400 ms) y evita que una fuente que nunca responde bloquee la
 * pantalla. Debe revisarse al integrar con el backend.
 */
export const DASHBOARD_QUERY_TIMEOUT_MS = 8000;

// Código del rechazo por tiempo límite.
export const DASHBOARD_TIMEOUT_CODE = 'DASHBOARD_TIMEOUT';
