/*
 * Estados de un participante dentro de una cohorte (RF-125).
 *
 * Los valores son los enumerados en las entradas de RF-125. Solo
 * describen lo que la fuente de datos informa: el frontend no los
 * calcula ni decide la elegibilidad. Esa regla (registro completo,
 * consentimiento aceptado y línea base registrada) es
 * responsabilidad del backend.
 */

// estado_participante_cohorte. Confirmado en RF-125.
export const PARTICIPATION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVO',
  INACTIVE: 'INACTIVO',
  PENDING_VALIDATION: 'PENDIENTE_VALIDACION',
});

/*
 * Estados de registro ya normalizados por RF-125 para el panel.
 */
export const REGISTRATION_STATUS = Object.freeze({
  PENDING: 'PENDIENTE',
  COMPLETE: 'COMPLETO',
  INCOMPLETE: 'INCOMPLETO',
});

// estado_consentimiento según RF-125.
export const CONSENT_STATUS = Object.freeze({
  ACCEPTED: 'ACEPTADO',
  NOT_ACCEPTED: 'NO_ACEPTADO',
  PENDING: 'PENDIENTE',
});

// estado_linea_base según RF-125.
export const BASELINE_STATUS = Object.freeze({
  REGISTERED: 'REGISTRADA',
  NOT_REGISTERED: 'NO_REGISTRADA',
  PENDING: 'PENDIENTE',
});
