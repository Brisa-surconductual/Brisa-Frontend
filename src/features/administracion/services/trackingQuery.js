import {
  SORT_DIRECTION,
  TRACKING_ALERT_FILTER,
  TRACKING_PAGE_SIZE,
  TRACKING_SORT_FIELD,
  TRACKING_THRESHOLDS,
} from '../types/participantTracking.js';

/*
 * Parámetros de la consulta de seguimiento (RF-142): filtros, orden y
 * paginación por offset y limit. Reglas puras: solo normalizan lo que
 * se pide a la fuente; filtrar, ordenar y paginar lo hace la fuente.
 *
 * Forma interna PROVISIONAL (los nombres reales los fijará el backend):
 *   { filters: { progressMin, adherenceMin, alerts },
 *     sort: { field, direction } | null, offset, limit }
 */
export const INITIAL_TRACKING_QUERY = Object.freeze({
  filters: Object.freeze({ progressMin: null, adherenceMin: null, alerts: null }),
  sort: null,
  offset: 0,
  limit: TRACKING_PAGE_SIZE,
});

const SORT_FIELDS = Object.values(TRACKING_SORT_FIELD);
const DIRECTIONS = Object.values(SORT_DIRECTION);
const ALERT_FILTERS = Object.values(TRACKING_ALERT_FILTER);

function threshold(value) {
  const number = Number(value);

  return value !== null && value !== '' && TRACKING_THRESHOLDS.includes(number) ? number : null;
}

function sortOf(sort) {
  return sort && SORT_FIELDS.includes(sort.field) && DIRECTIONS.includes(sort.direction)
    ? Object.freeze({ field: sort.field, direction: sort.direction })
    : null;
}

// Solo admite valores conocidos: el resto se ignora, nunca se reenvía.
export function normalizeTrackingQuery(query = {}) {
  const filters = query.filters ?? {};
  const offset = Number.isInteger(query.offset) && query.offset > 0 ? query.offset : 0;

  return Object.freeze({
    filters: Object.freeze({
      progressMin: threshold(filters.progressMin),
      adherenceMin: threshold(filters.adherenceMin),
      alerts: ALERT_FILTERS.includes(filters.alerts) ? filters.alerts : null,
    }),
    sort: sortOf(query.sort),
    offset,
    limit: TRACKING_PAGE_SIZE,
  });
}

export function hasActiveFilters(query) {
  return Object.values(query.filters).some((value) => value !== null);
}

// Un cambio de filtro u orden vuelve a la primera página.
export function withFilter(query, name, value) {
  return normalizeTrackingQuery({ ...query, filters: { ...query.filters, [name]: value }, offset: 0 });
}

export function withSort(query, sort) {
  return normalizeTrackingQuery({ ...query, sort, offset: 0 });
}

export function withoutFilters(query) {
  return normalizeTrackingQuery({ ...query, filters: {}, offset: 0 });
}

export function withPage(query, direction, total) {
  const offset = query.offset + direction * query.limit;

  if (offset < 0 || offset >= Math.max(total, 1)) return query;

  return normalizeTrackingQuery({ ...query, offset });
}

// Valor de un selector de orden ('progreso-desc') y su inverso.
export function sortToValue(sort) {
  return sort ? `${sort.field}-${sort.direction}` : '';
}

export function valueToSort(value) {
  const [field, direction] = String(value ?? '').split('-');

  return sortOf({ field, direction });
}
