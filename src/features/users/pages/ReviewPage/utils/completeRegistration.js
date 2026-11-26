import { USER_ROLE } from '../../../types/authTypes.js';

/*
 * Finalización del registro en dos operaciones distintas:
 *
 * 1. POST /usuarios/crear/estudiante: crea la cuenta y deja la
 *    cookie de sesión, pero su respuesta NO incluye el token CSRF
 *    ni el idUsuario.
 * 2. GET /usuarios/sesion/actual: devuelve los datos reales de la
 *    sesión y un token CSRF vigente (se guarda al consultarla).
 *
 * El POST no es idempotente: nunca se reintenta desde aquí.
 */
export const REGISTRATION_OUTCOME = Object.freeze({
  // Cuenta creada y sesión verificada.
  SESSION_READY: 'SESSION_READY',
  // Cuenta creada, pero la sesión no pudo establecerse.
  SESSION_UNAVAILABLE: 'SESSION_UNAVAILABLE',
  // El backend respondió con error: la cuenta no se creó.
  CREATION_REJECTED: 'CREATION_REJECTED',
  // Sin respuesta (red, tiempo agotado, pasarela): no se sabe
  // si la cuenta quedó creada.
  CREATION_UNCERTAIN: 'CREATION_UNCERTAIN',
});

// Respuestas de un intermediario: el backend pudo haber procesado.
const GATEWAY_STATUSES = Object.freeze([502, 503, 504]);

function isCreationUncertain(error) {
  const status = error?.response?.status;

  return !status || GATEWAY_STATUSES.includes(status);
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/*
 * La sesión debe ser la de la cuenta recién creada: si el
 * navegador no aceptó la cookie nueva podría seguir enviando
 * la de otra cuenta.
 */
function isSessionOfCreatedAccount(session, email) {
  return (
    Boolean(session?.idUsuario) &&
    session.rol === USER_ROLE.ESTUDIANTE &&
    normalizeEmail(session.correoElectronico) === normalizeEmail(email)
  );
}

export async function completeRegistration({
  payload,
  createAccount,
  fetchSession,
}) {
  let createdAccount;

  try {
    createdAccount = await createAccount(payload);
  } catch (error) {
    return {
      outcome: isCreationUncertain(error)
        ? REGISTRATION_OUTCOME.CREATION_UNCERTAIN
        : REGISTRATION_OUTCOME.CREATION_REJECTED,
      error,
    };
  }

  const email =
    createdAccount?.correo_electronico ?? payload.correoElectronico;

  try {
    const session = await fetchSession();

    if (isSessionOfCreatedAccount(session, email)) {
      return {
        outcome: REGISTRATION_OUTCOME.SESSION_READY,
        createdAccount,
        session,
      };
    }
  } catch {
    // La cuenta existe: el fallo es solo de la sesión.
  }

  return {
    outcome: REGISTRATION_OUTCOME.SESSION_UNAVAILABLE,
    createdAccount,
  };
}
