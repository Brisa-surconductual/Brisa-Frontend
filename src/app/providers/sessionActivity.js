/*
 * Confirmación de actividad con el backend
 * (POST /usuarios/sesion/actividad, cookie + X-CSRF-Token).
 *
 * Contrato (develop):
 * - 200: la sesión sigue activa y registra la interacción.
 * - 401: el backend ya no reconoce la sesión (expirada, cerrada o
 *        sin cookie). No se extiende nada.
 * - 403: token CSRF inválido; la sesión sigue activa. Se renueva
 *        con GET /usuarios/sesion/actual (solo cookie) y se
 *        reintenta una vez. Solo ocurre ante este fallo: la
 *        consulta rota el token y no se usa como latido.
 * - Red o 5xx: sin confirmación.
 *
 * Registrar actividad NO renueva la cookie: su vida absoluta la
 * fija el inicio de sesión.
 */
export const ACTIVITY_RESULT = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  UNCONFIRMED: 'UNCONFIRMED',
  // Abortada (cierre de sesión en curso o componente desmontado).
  CANCELLED: 'CANCELLED',
});

/*
 * Solo se informa la aplicación en primer plano. El estado
 * SEGUNDO_PLANO tiene su propio límite en el backend y no se
 * envía mientras no se defina esa política.
 */
export const APPLICATION_STATE = Object.freeze({
  ACTIVE: 'ACTIVA',
});

const CSRF_REJECTED = 'CSRF_REJECTED';

async function requestOnce(requestActivity, signal) {
  if (signal?.aborted) return ACTIVITY_RESULT.CANCELLED;

  try {
    await requestActivity({
      estadoAplicacion: APPLICATION_STATE.ACTIVE,
      signal,
    });
    return ACTIVITY_RESULT.ACTIVE;
  } catch (error) {
    if (signal?.aborted) return ACTIVITY_RESULT.CANCELLED;

    const status = error?.response?.status;

    if (status === 401) return ACTIVITY_RESULT.EXPIRED;
    if (status === 403) return CSRF_REJECTED;

    return ACTIVITY_RESULT.UNCONFIRMED;
  }
}

export async function confirmSessionActivity({
  requestActivity,
  renewCsrfToken,
  signal,
}) {
  const first = await requestOnce(requestActivity, signal);

  if (first !== CSRF_REJECTED) return first;

  try {
    await renewCsrfToken({ signal });
  } catch (error) {
    if (signal?.aborted) return ACTIVITY_RESULT.CANCELLED;

    return error?.response?.status === 401
      ? ACTIVITY_RESULT.EXPIRED
      : ACTIVITY_RESULT.UNCONFIRMED;
  }

  const second = await requestOnce(requestActivity, signal);

  return second === CSRF_REJECTED ? ACTIVITY_RESULT.UNCONFIRMED : second;
}

/*
 * Una interacción real solo se informa si pasó el intervalo desde
 * el último intento y no hay otro en curso. Un usuario inactivo
 * no genera interacciones: no hay peticiones que mantengan viva
 * su sesión.
 */
export function shouldSyncActivity({
  now,
  lastAttemptAt,
  intervalMs,
  isInFlight,
}) {
  return !isInFlight && now - lastAttemptAt >= intervalMs;
}
