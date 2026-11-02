/*
 * Cierre de la sesión en el servidor (POST /usuarios/cerrar-sesion).
 *
 * La cookie es HTTP-only: el frontend no puede borrarla, solo
 * pedir al backend que invalide la sesión. Por eso el cierre
 * local nunca se presenta como cierre remoto sin confirmación.
 *
 * Contrato del backend (develop):
 * - 200: sesión invalidada y cookie eliminada.
 * - 401: no había sesión activa (expirada, cerrada o sin cookie).
 *        El servidor ya no la acepta: equivale a cerrada.
 * - 403: token CSRF inválido. La sesión SIGUE activa. Se renueva
 *        el token con GET /usuarios/sesion/actual (solo requiere
 *        la cookie) y se reintenta una única vez.
 * - Red, tiempo agotado o 5xx: no hay confirmación.
 */
export const REMOTE_LOGOUT_RESULT = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  ALREADY_CLOSED: 'ALREADY_CLOSED',
  UNCONFIRMED: 'UNCONFIRMED',
  // Abortado porque empezó una sesión nueva: no se toca nada.
  CANCELLED: 'CANCELLED',
});

/*
 * Marca persistente de un cierre sin confirmar. Mientras exista,
 * al abrir la app se reintenta el cierre en lugar de restaurar
 * la sesión con la cookie que pudo quedar viva.
 */
export const LOGOUT_PENDING_KEY = 'logoutPending';

const CSRF_TOKEN_KEY = 'csrfToken';

/*
 * Límite para no dejar la pantalla abierta si la red no responde.
 * Al vencer se ABORTAN las solicitudes (no basta con dejar de
 * esperarlas): una respuesta tardía con `Set-Cookie` borraría la
 * cookie de una sesión iniciada después. El backend pudo haber
 * procesado la solicitud igualmente; por eso el resultado es
 * "sin confirmar", nunca "cerrada".
 */
export const REMOTE_LOGOUT_DEADLINE_MS = 10_000;

const CSRF_REJECTED = 'CSRF_REJECTED';

async function requestOnce(requestLogout, signal) {
  if (signal.aborted) return REMOTE_LOGOUT_RESULT.UNCONFIRMED;

  try {
    await requestLogout({ signal });
    return REMOTE_LOGOUT_RESULT.CONFIRMED;
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) return REMOTE_LOGOUT_RESULT.ALREADY_CLOSED;
    if (status === 403) return CSRF_REJECTED;

    return REMOTE_LOGOUT_RESULT.UNCONFIRMED;
  }
}

async function attemptRemoteLogout({ requestLogout, renewCsrfToken, signal }) {
  const first = await requestOnce(requestLogout, signal);

  if (first !== CSRF_REJECTED) return first;
  if (signal.aborted) return REMOTE_LOGOUT_RESULT.UNCONFIRMED;

  try {
    await renewCsrfToken({ signal });
  } catch (error) {
    return error?.response?.status === 401
      ? REMOTE_LOGOUT_RESULT.ALREADY_CLOSED
      : REMOTE_LOGOUT_RESULT.UNCONFIRMED;
  }

  const second = await requestOnce(requestLogout, signal);

  return second === CSRF_REJECTED ? REMOTE_LOGOUT_RESULT.UNCONFIRMED : second;
}

/*
 * Ejecuta el cierre remoto y deja el almacenamiento coherente
 * con el resultado: sin confirmación se conserva la marca de
 * cierre pendiente (y el token CSRF, útil para el reintento).
 *
 * `signal` (externo) cancela el cierre cuando empieza una sesión
 * nueva: se abortan las solicitudes y no se modifica el
 * almacenamiento, que ya pertenece a esa sesión.
 */
export async function closeRemoteSession({
  requestLogout,
  renewCsrfToken,
  storage,
  signal,
  deadlineMs = REMOTE_LOGOUT_DEADLINE_MS,
}) {
  const controller = new AbortController();
  const abort = () => controller.abort();

  if (signal?.aborted) return REMOTE_LOGOUT_RESULT.CANCELLED;
  signal?.addEventListener('abort', abort);

  const timerId = setTimeout(abort, deadlineMs);

  // Respaldo: si una solicitud ignora la señal, no se espera más.
  const aborted = new Promise((resolve) => {
    controller.signal.addEventListener('abort', () =>
      resolve(REMOTE_LOGOUT_RESULT.UNCONFIRMED),
    );
  });

  let result;

  try {
    result = await Promise.race([
      attemptRemoteLogout({
        requestLogout,
        renewCsrfToken,
        signal: controller.signal,
      }),
      aborted,
    ]);
  } catch {
    result = REMOTE_LOGOUT_RESULT.UNCONFIRMED;
  } finally {
    clearTimeout(timerId);
    signal?.removeEventListener('abort', abort);
  }

  if (signal?.aborted) return REMOTE_LOGOUT_RESULT.CANCELLED;

  if (result === REMOTE_LOGOUT_RESULT.UNCONFIRMED) {
    storage.setItem(LOGOUT_PENDING_KEY, 'true');
  } else {
    storage.removeItem(LOGOUT_PENDING_KEY);
    storage.removeItem(CSRF_TOKEN_KEY);
  }

  return result;
}

/*
 * Evita cierres duplicados: mientras haya uno en curso en
 * `slot.current`, las llamadas siguientes reciben la misma
 * promesa en lugar de iniciar otra solicitud.
 */
export function runSingleFlight(slot, start) {
  if (slot.current) return slot.current;

  slot.current = Promise.resolve()
    .then(start)
    .finally(() => {
      slot.current = null;
    });

  return slot.current;
}

/*
 * Arranque de la app: con un cierre pendiente se reintenta el
 * cierre y NO se restaura la sesión con la cookie; si no, se
 * restaura como siempre.
 */
export async function restoreOrRetryLogout({
  storage,
  retryLogout,
  restoreSession,
}) {
  if (hasPendingLogout(storage)) {
    await retryLogout();
    return;
  }

  await restoreSession();
}

export function hasPendingLogout(storage) {
  return storage.getItem(LOGOUT_PENDING_KEY) !== null;
}

export function clearPendingLogout(storage) {
  storage.removeItem(LOGOUT_PENDING_KEY);
}
