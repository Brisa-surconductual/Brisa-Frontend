import { describe, expect, it } from 'vitest';

import {
  getActivitySyncIntervalMs,
  resolveSessionTimeout,
} from './sessionConfig.js';

const MINUTE_MS = 60 * 1000;

const PRODUCTION = Object.freeze({
  warningDelayMs: 28 * MINUTE_MS,
  countdownMs: 2 * MINUTE_MS,
});

const DEVELOPMENT = Object.freeze({
  warningDelayMs: 4 * MINUTE_MS,
  countdownMs: 1 * MINUTE_MS,
});

function totalMs({ warningDelayMs, countdownMs }) {
  return warningDelayMs + countdownMs;
}

describe('Tiempos de sesión alineados con el backend', () => {
  it('con 15 minutos del backend el cierre local llega antes (12,5 min)', () => {
    const timeout = resolveSessionTimeout(15, PRODUCTION);

    expect(timeout.countdownMs).toBe(2 * MINUTE_MS);
    expect(timeout.warningDelayMs).toBe(10.5 * MINUTE_MS);
    expect(totalMs(timeout)).toBeLessThan(15 * MINUTE_MS);
  });

  it('conserva los tiempos configurados si ya son más cortos', () =>
    expect(resolveSessionTimeout(15, DEVELOPMENT)).toBe(DEVELOPMENT));

  it.each([undefined, null, 0, -1, Number.NaN, '15'])(
    'sin un límite válido (%s) conserva los tiempos configurados',
    (limite) =>
      expect(resolveSessionTimeout(limite, PRODUCTION)).toBe(PRODUCTION),
  );

  it('el intervalo de sincronización es de 2 minutos como máximo', () => {
    expect(getActivitySyncIntervalMs(15)).toBe(2 * MINUTE_MS);
    expect(getActivitySyncIntervalMs(4)).toBe(1 * MINUTE_MS);
    expect(getActivitySyncIntervalMs(null)).toBe(2 * MINUTE_MS);
  });

  /*
   * El backend puede ir hasta un intervalo de sincronización por
   * detrás de la última interacción: el cierre local debe ocurrir
   * antes de que el servidor expire la sesión.
   */
  it.each([1, 2, 5, 10, 15, 20, 30, 60])(
    'con %s minutos el cierre local precede a la expiración del backend',
    (limite) => {
      const timeout = resolveSessionTimeout(limite, PRODUCTION);
      const worstServerLagMs = getActivitySyncIntervalMs(limite);

      expect(timeout.warningDelayMs).toBeGreaterThan(0);
      expect(timeout.countdownMs).toBeGreaterThan(0);
      expect(totalMs(timeout) + worstServerLagMs).toBeLessThan(
        limite * MINUTE_MS,
      );
    },
  );
});
