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
 * estado_registro según RF-125. PENDIENTE de confirmar: M01 usa otros
 * valores (PENDIENTE_CONSENTIMIENTO, PENDIENTE_REVISION,
 * REGISTRO_COMPLETO) y la correspondencia entre ambos no está
 * definida. No se traduce aquí ningún valor de M01.
 */
export const REGISTRATION_STATUS = Object.freeze({
  PENDING: 'PENDIENTE',
  COMPLETE: 'COMPLETO',
  INCOMPLETE: 'INCOMPLETO',
});

// estado_consentimiento según RF-125. PENDIENTE de confirmar con el backend.
export const CONSENT_STATUS = Object.freeze({
  ACCEPTED: 'ACEPTADO',
  NOT_ACCEPTED: 'NO_ACEPTADO',
  PENDING: 'PENDIENTE',
});

// estado_linea_base según RF-125. PENDIENTE de confirmar con el backend.
export const BASELINE_STATUS = Object.freeze({
  REGISTERED: 'REGISTRADA',
  NOT_REGISTERED: 'NO_REGISTRADA',
  PENDING: 'PENDIENTE',
});
