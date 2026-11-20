import {
  NOTIFICATION_COUNT_FIELDS,
  NOTIFICATION_RATE_FIELDS,
  SECTION_OUTCOME,
} from '../types/participantEngagement.js';
import { INDICATOR_STATE, NOT_CALCULABLE } from '../types/participantTracking.js';

import { checkSectionEnvelope } from './profileSectionResponse.js';

/*
 * Interpretación de la interacción con notificaciones (RF-131, métricas
 * expuestas por M07 conforme a RF-98). Pura.
 *
 * 1. Autorización explícita propia (RF-102: el acceso individual exige
 *    un permiso distinto del de métricas agregadas) y aislamiento por
 *    cohorte y referencia (services/profileSectionResponse).
 * 2. Sin métricas (`metrics` ausente): equivale al 204 de RF-131.
 * 3. LISTA EXPLÍCITA de campos: los cinco totales y las tres tasas. Se
 *    descartan contenido de mensajes, eventos desencadenantes,
 *    identificadores y cualquier otro dato.
 * 4. Cada métrica se clasifica sin calcular nada:
 *    - total: entero ≥ 0 (incluido el cero real); tasa: número finito,
 *      sin convertir a porcentaje ni suponer escala;
 *    - la marca NO_CALCULABLE se respeta y NUNCA se convierte en cero;
 *    - cualquier otro valor, o su ausencia, es «no disponible».
 *    Si alguna es NO_CALCULABLE se informa (200 parcial de RF-131).
 *
 * Forma PROVISIONAL de la respuesta:
 *   { access, cohortId, reference, metrics: { sent, delivered, opened,
 *     dismissed, sessionsFromNotification, openRate, conversionRate,
 *     dismissalRate } | null }
 */
const available = (value) => Object.freeze({ state: INDICATOR_STATE.AVAILABLE, value });
const NOT_AVAILABLE = Object.freeze({ state: INDICATOR_STATE.NOT_AVAILABLE, value: null });
const CALCULABLE_NOT = Object.freeze({ state: INDICATOR_STATE.NOT_CALCULABLE, value: null });

function toCount(value) {
  if (Number.isInteger(value) && value >= 0) return available(value);

  return value === NOT_CALCULABLE ? CALCULABLE_NOT : NOT_AVAILABLE;
}

function toRate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return available(value);

  return value === NOT_CALCULABLE ? CALCULABLE_NOT : NOT_AVAILABLE;
}

export function interpretNotificationInteractionResponse(response, request) {
  const blocked = checkSectionEnvelope(response, request);

  if (blocked) return Object.freeze({ outcome: blocked });

  const { metrics } = response;

  if (metrics === null || metrics === undefined) return Object.freeze({ outcome: SECTION_OUTCOME.EMPTY });

  if (typeof metrics !== 'object' || Array.isArray(metrics)) return Object.freeze({ outcome: SECTION_OUTCOME.MALFORMED });

  const counts = Object.fromEntries(NOTIFICATION_COUNT_FIELDS.map((field) => [field, toCount(metrics[field])]));
  const rates = Object.fromEntries(NOTIFICATION_RATE_FIELDS.map((field) => [field, toRate(metrics[field])]));
  const hasNotCalculable = [...Object.values(counts), ...Object.values(rates)]
    .some(({ state }) => state === INDICATOR_STATE.NOT_CALCULABLE);

  return Object.freeze({
    outcome: SECTION_OUTCOME.OK,
    data: Object.freeze({ counts: Object.freeze(counts), rates: Object.freeze(rates), hasNotCalculable }),
  });
}
