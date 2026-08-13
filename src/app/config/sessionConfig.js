const MINUTE_MS = 60 * 1000;

export const SESSION_WARNING_MS = 2 * MINUTE_MS;

export const DEFAULT_SESSION_INACTIVITY_MINUTES = 15;

export function getSessionTimeoutConfig(
  inactivityMinutes = DEFAULT_SESSION_INACTIVITY_MINUTES,
) {
  const totalMs = inactivityMinutes * MINUTE_MS;

  const countdownMs = Math.min(SESSION_WARNING_MS, totalMs);

  return {
    warningDelayMs: Math.max(0, totalMs - countdownMs),

    countdownMs,
  };
}

export const SESSION_END_REASON = Object.freeze({
  INACTIVITY: 'INACTIVITY',
  MANUAL: 'MANUAL',
});
