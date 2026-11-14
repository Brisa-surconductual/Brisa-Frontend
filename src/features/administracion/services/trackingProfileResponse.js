import {
  INDICATOR_STATE,
  NOT_CALCULABLE,
  PROFILE_OUTCOME,
  TRACKING_ACCESS,
} from '../types/participantTracking.js';

/*
 * Interpretación de la respuesta de la ficha individual (RF-128). Pura.
 *
 * 1. Autorización explícita: sin `access === AUTORIZADO` se trata como
 *    denegada y no se conserva NINGÚN dato, aunque la respuesta lo traiga.
 * 2. Aislamiento (RF-128): si la respuesta declara otra cohorte u otra
 *    referencia que las pedidas, se bloquea entera (inconsistente).
 * 3. Sin perfil (`profile` ausente): equivale al 204 de RF-128.
 * 4. LISTA EXPLÍCITA de campos: code, y del perfil progress, adherence,
 *    trend, activeAlerts [{ type, generatedAt }] y updatedAt. Todo lo
 *    demás (UUID, correo, nombre, nivel de craving, textos, elegibilidad
 *    de RF-125) se descarta.
 *
 * Los indicadores se presentan tal como llegan: un número es el valor
 * principal (sin convertirlo a porcentaje ni suponer unidades), la marca
 * NO_CALCULABLE se respeta y cualquier otro valor es «no disponible».
 *
 * Forma PROVISIONAL de la respuesta, pendiente de contrato:
 *   { access, cohortId, reference, code, profile: { progress, adherence,
 *     trend, activeAlerts: [{ type, generatedAt }], updatedAt } | null }
 */
const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

function toIndicator(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Object.freeze({ state: INDICATOR_STATE.AVAILABLE, value });
  }

  if (value === NOT_CALCULABLE) return Object.freeze({ state: INDICATOR_STATE.NOT_CALCULABLE, value: null });

  return Object.freeze({ state: INDICATOR_STATE.NOT_AVAILABLE, value: null });
}

function toAlerts(value) {
  if (!Array.isArray(value)) return null;

  return Object.freeze(
    value
      .filter((alert) => alert && typeof alert === 'object')
      .map((alert) => Object.freeze({ type: text(alert.type), generatedAt: text(alert.generatedAt) })),
  );
}

function toProfile(profile) {
  return Object.freeze({
    progress: toIndicator(profile.progress),
    adherence: toIndicator(profile.adherence),
    trend: text(profile.trend),
    activeAlerts: toAlerts(profile.activeAlerts),
    updatedAt: text(profile.updatedAt),
  });
}

const denied = Object.freeze({ outcome: PROFILE_OUTCOME.DENIED });
const inconsistent = Object.freeze({ outcome: PROFILE_OUTCOME.INCONSISTENT });

export function interpretProfileResponse(response, { cohortId, reference }) {
  if (!response || response.access !== TRACKING_ACCESS.GRANTED) return denied;

  if (response.cohortId !== cohortId || response.reference !== reference) return inconsistent;

  const code = text(response.code);

  if (!response.profile || typeof response.profile !== 'object') {
    return Object.freeze({ outcome: PROFILE_OUTCOME.NO_PROFILE, code, profile: null });
  }

  return Object.freeze({ outcome: PROFILE_OUTCOME.OK, code, profile: toProfile(response.profile) });
}
