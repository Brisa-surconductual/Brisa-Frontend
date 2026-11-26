/*
 * Clasificación de los errores del listado (RF-142) y de la ficha
 * (RF-128). Se decide por `status` y `codigo` (forma de `toApiError`),
 * nunca por el texto. La fuente de la demostración rechaza con la misma
 * forma, así que ambos modos se clasifican igual.
 */

// Códigos que genera el propio frontend antes de consultar la ficha.
export const TRACKING_CLIENT_ERROR = Object.freeze({
  // El identificador de la ruta no es un seudónimo válido: no se consulta.
  INVALID_CODE: 'IDENTIFICADOR_INVALIDO',
  // El participante no es miembro activo de la cohorte de la ruta.
  OUTSIDE_COHORT: 'PARTICIPANTE_FUERA_DE_COHORTE',
});

// Motivo por el que el listado no muestra registros.
export const TRACKING_PROBLEM = Object.freeze({
  INVALID_QUERY: 'INVALID_QUERY',
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  DENIED: 'DENIED',
  NOT_FOUND: 'NOT_FOUND',
  UNAVAILABLE: 'UNAVAILABLE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  ERROR: 'ERROR',
});

export function classifyTrackingError(error) {
  switch (error?.status) {
    case 400: return TRACKING_PROBLEM.INVALID_QUERY;
    case 401: return TRACKING_PROBLEM.SESSION_REQUIRED;
    case 403: return TRACKING_PROBLEM.DENIED;
    case 404: return TRACKING_PROBLEM.NOT_FOUND;
    case 503: return TRACKING_PROBLEM.UNAVAILABLE;
    default: return TRACKING_PROBLEM.ERROR;
  }
}

/*
 * Situación de la ficha (RF-128). NO_PROFILE 204, DENIED 403, NOT_FOUND
 * 404 PARTICIPANTE_NO_ENCONTRADO, COHORT_NOT_FOUND 404
 * COHORTE_NO_ENCONTRADA (comprobación de pertenencia), INCONSISTENT 409 o
 * respuesta de otro participante, UNAVAILABLE 503, ERROR 500, red o
 * respuesta inválida.
 */
export const PROFILE_STATUS = Object.freeze({
  READY: 'READY',
  NO_PROFILE: 'NO_PROFILE',
  INVALID_CODE: 'INVALID_CODE',
  SESSION_REQUIRED: 'SESSION_REQUIRED',
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

export function classifyProfileError(error) {
  if (error?.codigo === TRACKING_CLIENT_ERROR.INVALID_CODE) return PROFILE_STATUS.INVALID_CODE;
  if (error?.codigo === TRACKING_CLIENT_ERROR.OUTSIDE_COHORT) return PROFILE_STATUS.OUTSIDE_COHORT;

  switch (error?.status) {
    case 400: return PROFILE_STATUS.INVALID_CODE;
    case 401: return PROFILE_STATUS.SESSION_REQUIRED;
    case 403: return PROFILE_STATUS.DENIED;
    case 404:
      return error.codigo === 'COHORTE_NO_ENCONTRADA' ? PROFILE_STATUS.COHORT_NOT_FOUND : PROFILE_STATUS.NOT_FOUND;
    case 409: return PROFILE_STATUS.INCONSISTENT;
    case 503: return PROFILE_STATUS.UNAVAILABLE;
    default: return PROFILE_STATUS.ERROR;
  }
}

// Rechazo con la forma de `toApiError`, para la fuente y la demostración.
export function trackingError(status, codigo) {
  return Object.assign(new Error(codigo ?? `HTTP ${status}`), { status, codigo });
}
