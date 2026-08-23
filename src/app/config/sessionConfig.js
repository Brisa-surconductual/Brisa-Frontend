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
});
