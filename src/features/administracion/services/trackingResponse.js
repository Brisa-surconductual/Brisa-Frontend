import {
  PROGRESS_LEVELS,
  TRACKING_ALERT_TYPE,
  TRACKING_OUTCOME,
} from '../types/participantTracking.js';

/*
 * Interpretación de una página del listado de seguimiento (RF-142). Pura.
 *
 * Contrato real: { items: [{ codigo_participante, nivel_progreso,
 * tasa_adherencia, alertas_activas, alertas_atendidas,
 * tipos_alerta_activa }], total, offset, limit, mensaje? }.
 *
 * - La respuesta no trae campos de autorización ni de cohorte: el acceso
 *   lo deciden las guardas del backend y una respuesta 200 basta. No se
 *   exigen campos que el contrato no tiene.
 * - LISTA EXPLÍCITA de campos por registro: cualquier otro campo (UUID,
 *   correo, nombre, textos clínicos) se descarta.
 * - `nivel_progreso` es una categoría; `tasa_adherencia`, una fracción
 *   entre 0 y 1. `null` significa que M05 aún no lo calculó: nunca se
 *   convierte en 0.
 * - Una respuesta que no cumple el contrato (código mal formado o
 *   repetido, valores fuera de rango, paginación inválida) no se
 *   presenta a medias: es INVALID.
 */
// Mismo formato que valida el backend para `codigo_participante`.
const CODE = /^[A-Z0-9-]{1,16}$/u;
const ALERT_TYPES = Object.values(TRACKING_ALERT_TYPE);

const isCount = (value) => Number.isInteger(value) && value >= 0;
const isFraction = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

const invalid = Object.freeze({ outcome: TRACKING_OUTCOME.INVALID });

function toEntry(item) {
  if (!item || typeof item !== 'object') return null;

  const {
    codigo_participante: code,
    nivel_progreso: level,
    tasa_adherencia: adherence,
    alertas_activas: active,
    alertas_atendidas: attended,
    tipos_alerta_activa: types,
  } = item;

  if (typeof code !== 'string' || !CODE.test(code)) return null;
  if (level !== null && !PROGRESS_LEVELS.includes(level)) return null;
  if (adherence !== null && !isFraction(adherence)) return null;
  if (!isCount(active) || !isCount(attended)) return null;
  if (!Array.isArray(types) || !types.every((type) => ALERT_TYPES.includes(type))) return null;
  if (types.length > active || (active > 0 && types.length === 0)) return null;

  return Object.freeze({
    code,
    progressLevel: level,
    adherence,
    activeAlertCount: active,
    attendedAlertCount: attended,
    activeAlertTypes: Object.freeze([...new Set(types)]),
  });
}

export function interpretTrackingResponse(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) return invalid;
  if (!isCount(data.total) || !isCount(data.offset) || !Number.isInteger(data.limit) || data.limit < 1) return invalid;
  if (data.items.length > data.limit || data.items.length > data.total) return invalid;

  const entries = data.items.map(toEntry);
  if (entries.some((entry) => entry === null)) return invalid;

  // Aislamiento: un código repetido indica una respuesta mezclada.
  if (new Set(entries.map(({ code }) => code)).size !== entries.length) return invalid;

  return Object.freeze({
    outcome: TRACKING_OUTCOME.OK,
    entries: Object.freeze(entries),
    total: data.total,
    offset: data.offset,
    limit: data.limit,
  });
}

// Página fuera de rango: sin registros con total > 0.
export const isOutOfRange = (page) => page.entries.length === 0 && page.total > 0;
