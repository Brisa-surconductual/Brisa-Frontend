import { ALERT_HISTORY_OUTCOME, TRACKING_ACCESS } from '../types/participantTracking.js';

import { sortAlertsChronologically } from './alertHistory.js';

/*
 * Interpretación de la respuesta del historial de alertas (RF-129). Pura.
 *
 * 1. Autorización explícita PROPIA de esta consulta: que la ficha
 *    (RF-128) esté autorizada no implica que el historial lo esté. Sin
 *    `access === AUTORIZADO` se trata como denegada y no se conserva
 *    ningún registro.
 * 2. Aislamiento: si la respuesta declara otra cohorte u otra referencia,
 *    o si UNA SOLA alerta no declara la referencia pedida, se bloquea el
 *    historial completo (409 de RF-129; criterio de fiabilidad).
 * 3. Sin alertas (lista vacía o ausente): equivale al 204 de RF-129.
 * 4. LISTA EXPLÍCITA de campos por alerta: type, source, generatedAt,
 *    status y resolvedAt. El identificador de la alerta (UUID), notas,
 *    niveles de craving y cualquier otro dato se descartan.
 * 5. Orden cronológico por fecha de generación (services/alertHistory).
 *
 * Forma PROVISIONAL de la respuesta, pendiente de contrato:
 *   { access, cohortId, reference, alerts: [{ reference, type, source,
 *     generatedAt, status, resolvedAt }] | null }
 */
const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

const toAlert = (alert) => Object.freeze({
  type: text(alert.type),
  source: text(alert.source),
  generatedAt: text(alert.generatedAt),
  status: text(alert.status),
  resolvedAt: text(alert.resolvedAt),
});

const denied = Object.freeze({ outcome: ALERT_HISTORY_OUTCOME.DENIED });
const inconsistent = Object.freeze({ outcome: ALERT_HISTORY_OUTCOME.INCONSISTENT });
const empty = Object.freeze({ outcome: ALERT_HISTORY_OUTCOME.EMPTY, alerts: Object.freeze([]) });
const malformed = Object.freeze({ outcome: ALERT_HISTORY_OUTCOME.MALFORMED });

export function interpretAlertHistoryResponse(response, { cohortId, reference }) {
  if (!response || response.access !== TRACKING_ACCESS.GRANTED) return denied;

  if (response.cohortId !== cohortId || response.reference !== reference) return inconsistent;

  if (response.alerts === null || response.alerts === undefined) return empty;

  if (!Array.isArray(response.alerts)) return malformed;

  const foreign = response.alerts.some((alert) => !alert || typeof alert !== 'object' || alert.reference !== reference);

  if (foreign) return inconsistent;

  if (response.alerts.length === 0) return empty;

  return Object.freeze({
    outcome: ALERT_HISTORY_OUTCOME.OK,
    alerts: Object.freeze(sortAlertsChronologically(response.alerts.map(toAlert))),
  });
}
