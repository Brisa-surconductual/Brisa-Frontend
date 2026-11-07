const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

/*
 * Único lugar donde se parametrizan los tiempos de la
 * sesión. Nadie más debe declarar duraciones.
 *
 * - warningDelayMs: inactividad tolerada antes de avisar.
 * - countdownMs: margen para responder antes del cierre.
 *
 * Producción: 30 min en total (28 min + 2 min de aviso).
 * Desarrollo: 5 min en total (4 min + 1 min de aviso),
 * para trabajar sin cierres tan frecuentes.
 */
const PRODUCTION_TIMEOUT = Object.freeze({
  warningDelayMs: 28 * MINUTE_MS,
  countdownMs: 2 * MINUTE_MS,
});

const DEVELOPMENT_TIMEOUT = Object.freeze({
  warningDelayMs: 4 * MINUTE_MS,
  countdownMs: 1 * MINUTE_MS,
});

export const SESSION_TIMEOUT = import.meta.env.DEV
  ? DEVELOPMENT_TIMEOUT
  : PRODUCTION_TIMEOUT;

export const SESSION_END_REASON = Object.freeze({
  INACTIVITY: 'INACTIVITY',
  MANUAL: 'MANUAL',
  // El backend ya no reconoce la sesión (401 al confirmar actividad).
  EXPIRED: 'EXPIRED',
});

/*
 * Sincronización con el límite de inactividad del backend
 * (`limiteInactividadMinutos` de iniciar-sesion y sesion/actual).
 *
 * El backend cuenta la inactividad desde la última petición
 * autenticada. La interacción del usuario se le informa como
 * máximo una vez cada `syncIntervalMs`, así que el servidor puede
 * ir hasta ese intervalo por detrás de la interacción real. El
 * cierre local debe ocurrir antes que el del servidor:
 *
 *   total local <= límite del backend - intervalo - margen
 */
const MAX_ACTIVITY_SYNC_INTERVAL_MS = 2 * MINUTE_MS;
const BACKEND_EXPIRY_MARGIN_MS = 30 * SECOND_MS;

export function getActivitySyncIntervalMs(backendLimitMinutes) {
  const limitMs = toBackendLimitMs(backendLimitMinutes);

  return limitMs === null
    ? MAX_ACTIVITY_SYNC_INTERVAL_MS
    : Math.min(MAX_ACTIVITY_SYNC_INTERVAL_MS, limitMs / 4);
}

function toBackendLimitMs(backendLimitMinutes) {
  return Number.isFinite(backendLimitMinutes) && backendLimitMinutes > 0
    ? backendLimitMinutes * MINUTE_MS
    : null;
}

/*
 * Tiempos efectivos del aviso y del cierre. Sin el dato del
 * backend se conservan los configurados aquí.
 */
export function resolveSessionTimeout(
  backendLimitMinutes,
  configured = SESSION_TIMEOUT,
) {
  const limitMs = toBackendLimitMs(backendLimitMinutes);
  const configuredTotalMs = configured.warningDelayMs + configured.countdownMs;

  if (limitMs === null) return configured;

  // Con límites muy cortos el margen no cabe: se usa la mitad.
  const totalMs = Math.min(
    configuredTotalMs,
    Math.max(
      limitMs / 2,
      limitMs -
        getActivitySyncIntervalMs(backendLimitMinutes) -
        BACKEND_EXPIRY_MARGIN_MS,
    ),
  );

  if (totalMs >= configuredTotalMs) return configured;

  const countdownMs = Math.min(configured.countdownMs, totalMs / 2);

  return Object.freeze({
    warningDelayMs: totalMs - countdownMs,
    countdownMs,
  });
}
