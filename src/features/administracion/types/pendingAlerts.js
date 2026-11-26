import { TRACKING_ALERT_TYPE } from './participantTracking.js';

/*
 * Bandeja de alertas pendientes (RF-146) y atención administrativa
 * (RF-147). Valores del contrato del backend (Brisa-Backend,
 * GestionAlertasController): GET /admin/cohortes/:id_cohorte/alertas/pendientes
 * y POST /admin/alertas/:id_alerta/atender.
 *
 * No confundir con el historial individual (RF-129, solo consulta) ni con
 * el total de alertas críticas del panel (RF-140, otro agregado).
 */

// Página de la bandeja: el backend admite `limit` de 1 a 100; por defecto 20.
export const PENDING_ALERTS_LIMIT = 20;
export const PENDING_ALERTS_MAX_LIMIT = 100;

// Filtro por tipo. `null` = todas (no se envía `tipo_alerta`).
export const PENDING_ALERT_FILTERS = Object.freeze([
  Object.freeze({ value: null, label: 'Todas' }),
  Object.freeze({ value: TRACKING_ALERT_TYPE.HIGH_CRAVING, label: 'Craving elevado' }),
  Object.freeze({ value: TRACKING_ALERT_TYPE.INACTIVITY, label: 'Inactividad' }),
]);

// RF-147: única acción admitida y límites del motivo (backend:
// MotivoAtencion, `ck_alerta_motivo`), medidos tras recortar espacios.
export const ATTEND_ACTION = 'MARCAR_ATENDIDA';
export const ATTEND_REASON_MIN = 10;
export const ATTEND_REASON_MAX = 500;

// Origen de los datos de la bandeja.
export const PENDING_ALERTS_SOURCE_MODE = Object.freeze({
  API: 'API',
  // Modo de demostración del M08: las cohortes son ficticias, así que la
  // bandeja no consulta ni escribe en el servidor.
  DEMO_UNAVAILABLE: 'DEMO_UNAVAILABLE',
});

export const PENDING_ALERTS_STATUS = Object.freeze({
  LOADING: 'LOADING',
  READY: 'READY',
  // 204: no hay alertas pendientes para la consulta.
  EMPTY: 'EMPTY',
  DEMO_UNAVAILABLE: 'DEMO_UNAVAILABLE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  DENIED: 'DENIED',
  COHORT_NOT_FOUND: 'COHORT_NOT_FOUND',
  // 503 M05_NO_DISPONIBLE.
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
});

// Resultado de «Marcar como atendida».
export const ATTEND_OUTCOME = Object.freeze({
  SUCCESS: 'SUCCESS',
  ALREADY_ATTENDED: 'ALREADY_ATTENDED',
  NOT_FOUND: 'NOT_FOUND',
  NOT_ACTIVE: 'NOT_ACTIVE',
  INVALID_REASON: 'INVALID_REASON',
  SOURCE_UNAVAILABLE: 'SOURCE_UNAVAILABLE',
  // 500 ERROR_TRANSACCION, otro 5xx o sin respuesta: el resultado no se
  // conoce. No hay éxito y hay que actualizar antes de reintentar.
  UNCONFIRMED: 'UNCONFIRMED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  DENIED: 'DENIED',
});
