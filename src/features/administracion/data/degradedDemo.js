import { DATA_STATE } from '../types/dataFreshness.js';

/*
 * MODO DEGRADADO SIMULADO (solo desarrollo; solo lo importan las
 * fuentes de demostración, que no llegan al build de producción).
 *
 * Representa lo que RF-149 asigna al BACKEND: ante la caída de un módulo
 * fuente, responder con el último estado conocido marcado como
 * DEGRADADO y la fecha exacta del último dato. Aquí no hay caché ni
 * almacenamiento: se marcan los mismos datos ficticios. No demuestra
 * resiliencia real.
 */
// Posterior a todas las fechas de los datos ficticios de M05, M06 y M07
// (la más reciente es del 9 de marzo a las 06:00): un último dato
// disponible no puede ser anterior a los datos que acompaña.
export const DEMO_LAST_AVAILABLE_AT = '2026-03-09T14:30:00-05:00';

// Fecha sin zona horaria: no es confiable y la interfaz no la interpreta.
const UNRELIABLE_LAST_AVAILABLE_AT = '2026-03-09 14:30';

export const asStale = (response) => ({
  ...response,
  dataState: DATA_STATE.DEGRADED,
  lastAvailableAt: DEMO_LAST_AVAILABLE_AT,
});

export const asStaleUndated = (response) => ({
  ...response,
  dataState: DATA_STATE.DEGRADED,
  lastAvailableAt: UNRELIABLE_LAST_AVAILABLE_AT,
});

// Escenarios comunes de las fuentes que RF-149 cubre (M05, M06, M07).
export const DEGRADED_SCENARIO = Object.freeze({
  STALE: 'desactualizado',
  STALE_UNDATED: 'desactualizado-sin-fecha',
});

export function applyDegradedScenario(response, scenario) {
  if (scenario === DEGRADED_SCENARIO.STALE) return asStale(response);
  if (scenario === DEGRADED_SCENARIO.STALE_UNDATED) return asStaleUndated(response);

  return response;
}
