import { REGISTRATION_STATUS } from '../types/registrationStatus.js';

/*
 * Alcance de la sesión que asigna el backend al iniciar sesión.
 * No cambia al aceptar el consentimiento: solo un nuevo inicio
 * de sesión lo actualiza.
 */
export const SESSION_SCOPE = Object.freeze({
  LIMITED: 'LIMITADA',
  FULL: 'COMPLETA',
});

/*
 * Estados de registro que entrega el backend (`estadoRegistro`
 * de iniciar-sesion y sesion/actual). Cualquier otro valor,
 * incluida su ausencia, se trata como desconocido: nunca como
 * registro completo.
 */
export const REGISTRATION_STATUS_VIEW = Object.freeze({
  COMPLETED: 'COMPLETED',
  // Registro completo con una sesión que no es COMPLETA.
  LIMITED_SESSION: 'LIMITED_SESSION',
  PENDING_CONSENT: 'PENDING_CONSENT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  UNKNOWN: 'UNKNOWN',
});

const VIEW_BY_STATUS = Object.freeze({
  [REGISTRATION_STATUS.PENDING_CONSENT]:
    REGISTRATION_STATUS_VIEW.PENDING_CONSENT,
  [REGISTRATION_STATUS.PENDING_REVIEW]: REGISTRATION_STATUS_VIEW.PENDING_REVIEW,
});

/*
 * REGISTRO_COMPLETO no implica alcance COMPLETA: sesion/actual
 * devuelve el estado almacenado (sin el ajuste que aplica el
 * login) y el alcance no se eleva al aceptar el consentimiento.
 * Solo la combinación completa se presenta como habilitada.
 */
export function getRegistrationStatusView(estadoRegistro, alcance) {
  if (estadoRegistro === REGISTRATION_STATUS.COMPLETED) {
    return alcance === SESSION_SCOPE.FULL
      ? REGISTRATION_STATUS_VIEW.COMPLETED
      : REGISTRATION_STATUS_VIEW.LIMITED_SESSION;
  }

  return VIEW_BY_STATUS[estadoRegistro] ?? REGISTRATION_STATUS_VIEW.UNKNOWN;
}

/*
 * Destino después del login.
 *
 * - PENDIENTE_CONSENTIMIENTO: al consentimiento (sin cambios).
 * - PENDIENTE_REVISION: a la app, NO a /registro/revision. El
 *   backend no ofrece cómo recuperar el borrador del registro y
 *   esa pantalla, sin datos en memoria, envía a crear una cuenta
 *   nueva. El inicio del estudiante informa el estado pendiente.
 * - Resto: a la app; cada inicio muestra el estado real.
 */
export function getPostLoginPath(estadoRegistro) {
  return estadoRegistro === REGISTRATION_STATUS.PENDING_CONSENT
    ? '/registro/consentimiento'
    : '/app';
}

/*
 * Resultado de consultar la sesión (GET /usuarios/sesion/actual)
 * para una identidad ya conocida.
 *
 * - ACCEPT: misma identidad; se adoptan sus datos reales.
 * - END: la sesión no es de esta identidad o ya no existe (401).
 *   Se descarta la identidad local. El CSRF guardado se conserva:
 *   el backend lo rotó y es el único válido para la cookie que el
 *   navegador tiene (podría ser la sesión de otra pestaña).
 * - UNKNOWN: sin respuesta válida; la identidad se mantiene, pero
 *   el estado de registro y el alcance quedan sin confirmar.
 */
export const REFRESHED_SESSION_ACTION = Object.freeze({
  ACCEPT: 'ACCEPT',
  END: 'END',
  UNKNOWN: 'UNKNOWN',
});

export function classifyRefreshedSession({ session, error, expectedUserId }) {
  if (error) {
    return error?.response?.status === 401
      ? REFRESHED_SESSION_ACTION.END
      : REFRESHED_SESSION_ACTION.UNKNOWN;
  }

  if (!session?.idUsuario || session.idUsuario !== expectedUserId) {
    return REFRESHED_SESSION_ACTION.END;
  }

  return REFRESHED_SESSION_ACTION.ACCEPT;
}
