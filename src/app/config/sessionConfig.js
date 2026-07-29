const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

/*
 * Único lugar donde se parametrizan los tiempos de la
 * sesión. Nadie más debe declarar duraciones.
 *
 * - warningDelayMs: inactividad tolerada antes de avisar.
 * - countdownMs: margen para responder antes del cierre.
 *
 * Producción: 15 min en total (14 min + 1 min de aviso),
 * el tiempo del prototipo. Desarrollo: 20 s (15 s + 5 s),
 * los valores demo del prototipo, para poder probarlo.
 */
const PRODUCTION_TIMEOUT = Object.freeze({
  warningDelayMs: 14 * MINUTE_MS,
  countdownMs: 1 * MINUTE_MS,
});

const DEVELOPMENT_TIMEOUT = Object.freeze({
  warningDelayMs: 15 * SECOND_MS,
  countdownMs: 5 * SECOND_MS,
});

export const SESSION_TIMEOUT = import.meta.env.DEV
  ? DEVELOPMENT_TIMEOUT
  : PRODUCTION_TIMEOUT;

export const SESSION_END_REASON = Object.freeze({
  INACTIVITY: 'INACTIVITY',
  MANUAL: 'MANUAL',
});
