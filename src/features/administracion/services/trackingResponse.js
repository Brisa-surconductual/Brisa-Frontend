import { TRACKING_ACCESS, TRACKING_OUTCOME } from '../types/participantTracking.js';

/*
 * Interpretación de una respuesta de seguimiento (RF-142). Pura.
 *
 * 1. Autorización explícita: sin `access === AUTORIZADO` la respuesta
 *    se trata como denegada y NINGÚN registro se conserva, aunque venga.
 * 2. Correspondencia con la cohorte: si la respuesta declara otra
 *    cohorte, se bloquea entera; si un registro declara otra cohorte, se
 *    descarta y se cuenta en `blockedCount` para avisar.
 * 3. LISTA EXPLÍCITA de campos por registro: code, progress, adherence y
 *    activeAlertCount. Cualquier otro campo (UUID internos, correos,
 *    nombres, estados de elegibilidad de RF-125, textos) se descarta.
 *    `cohortId` solo se usa para la comprobación anterior.
 *
 * Forma PROVISIONAL de la respuesta, pendiente de contrato:
 *   { access, cohortId, total, offset, limit, items: [{ cohortId, code,
 *     progress, adherence, activeAlertCount }] }
 */
function percentage(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function count(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function toTrackingEntry(item) {
  return Object.freeze({
    code: typeof item.code === 'string' ? item.code.trim() : '',
    progress: percentage(item.progress),
    adherence: percentage(item.adherence),
    activeAlertCount: count(item.activeAlertCount),
  });
}

const denied = Object.freeze({ outcome: TRACKING_OUTCOME.DENIED });
const inconsistent = Object.freeze({ outcome: TRACKING_OUTCOME.INCONSISTENT });

export function interpretTrackingResponse(response, cohortId) {
  if (!response || response.access !== TRACKING_ACCESS.GRANTED) return denied;

  if (response.cohortId !== cohortId) return inconsistent;

  const items = Array.isArray(response.items) ? response.items : [];
  const own = items.filter((item) => item && item.cohortId === cohortId);

  return Object.freeze({
    outcome: TRACKING_OUTCOME.OK,
    entries: Object.freeze(own.map(toTrackingEntry)),
    blockedCount: items.length - own.length,
    total: count(response.total) ?? own.length,
    offset: count(response.offset) ?? 0,
  });
}
