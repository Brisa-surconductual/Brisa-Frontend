import { SORT_DIRECTION, TRACKING_ALERT_FILTER, TRACKING_SORT_FIELD } from '../types/participantTracking.js';

/*
 * EMULACIÓN DEL SERVIDOR (solo demostración). RF-142 asigna al backend
 * aplicar filtros, orden y paginación; aquí la fuente de demostración lo
 * imita para que la interfaz nunca filtre ni ordene por su cuenta.
 *
 * Reglas provisionales de la demo:
 *   - un mínimo de progreso o adherencia excluye los indicadores no
 *     disponibles (null);
 *   - al ordenar, los no disponibles van siempre al final;
 *   - sin orden se conserva el orden de las asociaciones.
 */
const FIELD_KEY = Object.freeze({
  [TRACKING_SORT_FIELD.PROGRESS]: 'progress',
  [TRACKING_SORT_FIELD.ADHERENCE]: 'adherence',
  [TRACKING_SORT_FIELD.ACTIVE_ALERTS]: 'activeAlertCount',
});

function matches(row, { progressMin, adherenceMin, alerts }) {
  if (progressMin !== null && !(row.progress !== null && row.progress >= progressMin)) return false;
  if (adherenceMin !== null && !(row.adherence !== null && row.adherence >= adherenceMin)) return false;
  if (alerts === TRACKING_ALERT_FILTER.WITH_ALERTS) return row.activeAlertCount > 0;
  if (alerts === TRACKING_ALERT_FILTER.WITHOUT_ALERTS) return row.activeAlertCount === 0;

  return true;
}

function compare(sort) {
  const key = FIELD_KEY[sort.field];
  const factor = sort.direction === SORT_DIRECTION.ASC ? 1 : -1;

  return (a, b) => {
    if (a[key] === null && b[key] === null) return 0;
    if (a[key] === null) return 1;
    if (b[key] === null) return -1;

    return (a[key] - b[key]) * factor;
  };
}

export function applyTrackingQuery(rows, query) {
  const filtered = rows.filter((row) => matches(row, query.filters));
  const ordered = query.sort ? [...filtered].sort(compare(query.sort)) : filtered;

  return {
    total: ordered.length,
    items: ordered.slice(query.offset, query.offset + query.limit),
  };
}
