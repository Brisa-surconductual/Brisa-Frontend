import { DATA_STATE, FRESHNESS_STATE } from '../types/dataFreshness.js';
import { parseAuditTimestamp } from '../utils/formatAuditTimestamp.js';

/*
 * Interpretación de la marca de modo degradado (RF-149). Pura y común a
 * todas las secciones de la ficha.
 *
 * Solo se aplica DESPUÉS de comprobar la autorización y el aislamiento
 * de la respuesta: una respuesta denegada o inconsistente nunca muestra
 * datos, estén degradados o no (los datos antiguos no eluden permisos).
 *
 * - Sin marca o ACTUAL: datos actuales.
 * - DEGRADADO con fecha ISO 8601 con zona: datos desactualizados, que se
 *   muestran con una advertencia que incluye esa fecha exacta.
 * - DEGRADADO sin fecha confiable (ausente, sin zona o inválida): no se
 *   muestran, porque RF-149 exige indicar la marca temporal exacta y no
 *   se puede inventar su antigüedad (decisión de la interfaz).
 * - Cualquier otra marca: se trata como error.
 */
export const CURRENT_FRESHNESS = Object.freeze({ state: FRESHNESS_STATE.CURRENT, lastAvailableAt: null });

const UNDATED = Object.freeze({ state: FRESHNESS_STATE.STALE_UNDATED, lastAvailableAt: null });
const INVALID = Object.freeze({ state: FRESHNESS_STATE.INVALID, lastAvailableAt: null });

export function interpretFreshness(response) {
  const state = response?.dataState;

  if (state === undefined || state === null || state === DATA_STATE.CURRENT) return CURRENT_FRESHNESS;

  if (state !== DATA_STATE.DEGRADED) return INVALID;

  const lastAvailableAt = typeof response.lastAvailableAt === 'string' ? response.lastAvailableAt.trim() : null;

  if (parseAuditTimestamp(lastAvailableAt) === null) return UNDATED;

  return Object.freeze({ state: FRESHNESS_STATE.STALE, lastAvailableAt });
}

/*
 * Estado que BLOQUEA la sección por su marca, o null si puede mostrarse.
 * Los catálogos de estado de cada sección usan los mismos valores
 * (STALE_UNDATED, ERROR).
 */
export function freshnessBlockingStatus(freshness) {
  if (freshness.state === FRESHNESS_STATE.STALE_UNDATED) return 'STALE_UNDATED';
  if (freshness.state === FRESHNESS_STATE.INVALID) return 'ERROR';

  return null;
}

export const isStale = (freshness) => freshness?.state === FRESHNESS_STATE.STALE;
