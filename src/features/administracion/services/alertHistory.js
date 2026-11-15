import { ALERT_RESOLUTION_STATUS } from '../types/participantTracking.js';
import { parseAuditTimestamp } from '../utils/formatAuditTimestamp.js';

/*
 * Reglas puras del historial de alertas (RF-129): orden cronológico,
 * presentación de la fecha de resolución y coherencia con el resumen de
 * alertas activas de la ficha (RF-128).
 */

/*
 * Orden cronológico por fecha de generación, de la más antigua a la más
 * reciente (RF-129 no fija el sentido: PENDIENTE de confirmar). Las
 * alertas sin fecha interpretable van al final, en el orden recibido.
 */
export function sortAlertsChronologically(alerts) {
  return alerts
    .map((alert, index) => ({ alert, index, time: parseAuditTimestamp(alert.generatedAt) }))
    .sort((a, b) => {
      if (a.time === null || b.time === null) {
        if (a.time === b.time) return a.index - b.index;
        return a.time === null ? 1 : -1;
      }

      return a.time - b.time || a.index - b.index;
    })
    .map(({ alert }) => alert);
}

// Cómo presentar la fecha de resolución, sin inventarla nunca.
export const RESOLUTION_DISPLAY = Object.freeze({
  DATE: 'DATE',
  UNAVAILABLE: 'UNAVAILABLE',
  NOT_RECORDED: 'NOT_RECORDED',
  NONE: 'NONE',
});

const CLOSED_STATUSES = Object.freeze([ALERT_RESOLUTION_STATUS.RESOLVED, ALERT_RESOLUTION_STATUS.DISMISSED]);

/*
 * - Fecha con zona: se muestra.
 * - Fecha presente pero no interpretable: «no disponible».
 * - Sin fecha en una alerta resuelta o descartada: «no registrada».
 * - Sin fecha en cualquier otro estado: no aplica y no se muestra.
 */
export function resolutionDisplay(alert) {
  if (alert.resolvedAt) {
    return parseAuditTimestamp(alert.resolvedAt) === null ? RESOLUTION_DISPLAY.UNAVAILABLE : RESOLUTION_DISPLAY.DATE;
  }

  return CLOSED_STATUSES.includes(alert.status) ? RESOLUTION_DISPLAY.NOT_RECORDED : RESOLUTION_DISPLAY.NONE;
}

const keyOf = (alert) => `${alert.type}|${alert.generatedAt}`;

function tally(alerts) {
  const counts = new Map();

  for (const alert of alerts) counts.set(keyOf(alert), (counts.get(keyOf(alert)) ?? 0) + 1);

  return counts;
}

/*
 * El resumen (RF-128) y el historial (RF-129) pueden llegar de consultas
 * distintas y actualizarse en momentos distintos. La interfaz no corrige
 * ninguno: solo detecta si las alertas ACTIVA del historial y las del
 * resumen difieren (por tipo y fecha de generación) para avisarlo. Sin
 * alguno de los dos no hay comparación.
 */
export function hasActiveSummaryMismatch(activeAlerts, history) {
  if (!Array.isArray(activeAlerts) || !Array.isArray(history)) return false;

  const summary = tally(activeAlerts);
  const active = tally(history.filter(({ status }) => status === ALERT_RESOLUTION_STATUS.ACTIVE));

  if (summary.size !== active.size) return true;

  return [...summary].some(([key, count]) => active.get(key) !== count);
}
