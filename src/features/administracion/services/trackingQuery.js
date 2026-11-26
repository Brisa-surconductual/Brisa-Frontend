import {
  PROGRESS_LEVELS,
  SORT_DIRECTION,
  TRACKING_ALERT_FILTER,
  TRACKING_PAGE_SIZE,
  TRACKING_SORT_FIELD,
  TRACKING_THRESHOLDS,
} from '../types/participantTracking.js';

/*
 * Consulta del listado de seguimiento (RF-142): filtros, orden y
 * paginación. Reglas puras: solo normalizan lo que se pide al backend;
 * filtrar, ordenar y paginar lo hace el backend.
 *
 * Forma interna:
 *   { filters: { level, adherenceMin, adherenceMax, alerts },
 *     sort: { field, direction } | null, offset, limit }
 * `adherenceMin` y `adherenceMax` son umbrales en % (25, 50, 75); al
 * backend se envían como fracción entre 0 y 1.
 */
export const INITIAL_TRACKING_QUERY = Object.freeze({
  filters: Object.freeze({ level: null, adherenceMin: null, adherenceMax: null, alerts: null }),
  sort: null,
  offset: 0,
  limit: TRACKING_PAGE_SIZE,
});

const SORT_FIELDS = Object.values(TRACKING_SORT_FIELD);
const DIRECTIONS = Object.values(SORT_DIRECTION);
const ALERT_FILTERS = Object.values(TRACKING_ALERT_FILTER);

function threshold(value) {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);

  return TRACKING_THRESHOLDS.includes(number) ? number : null;
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
  let adherenceMin = threshold(filters.adherenceMin);
  let adherenceMax = threshold(filters.adherenceMax);

  // El backend rechaza un mínimo mayor que el máximo (400): no se envía.
  if (adherenceMin !== null && adherenceMax !== null && adherenceMin > adherenceMax) {
    adherenceMax = null;
  }

  return Object.freeze({
    filters: Object.freeze({
      level: PROGRESS_LEVELS.includes(filters.level) ? filters.level : null,
      adherenceMin,
      adherenceMax,
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

// Un cambio de filtro u orden vuelve a la primera página. Si el nuevo
// límite de adherencia choca con el otro, se descarta el otro.
export function withFilter(query, name, value) {
  const filters = { ...query.filters, [name]: value };
  const min = threshold(filters.adherenceMin);
  const max = threshold(filters.adherenceMax);

  if (min !== null && max !== null && min > max) {
    if (name === 'adherenceMin') filters.adherenceMax = null;
    if (name === 'adherenceMax') filters.adherenceMin = null;
  }

  return normalizeTrackingQuery({ ...query, filters, offset: 0 });
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

// Página fuera de rango (por ejemplo, tras cambiar los datos): la última.
export function withOffset(query, offset) {
  return normalizeTrackingQuery({ ...query, offset });
}

export function lastPageOffset(total, limit) {
  return total > 0 ? Math.floor((total - 1) / limit) * limit : 0;
}

// Valor de un selector de orden ('tasa_adherencia:DESC') y su inverso.
export function sortToValue(sort) {
  return sort ? `${sort.field}:${sort.direction}` : '';
}

export function valueToSort(value) {
  const [field, direction] = String(value ?? '').split(':');

  return sortOf({ field, direction });
}

const fraction = (percentage) => percentage / 100;

/*
 * Parámetros reales de `GET .../participantes/indicadores`. Solo se envía
 * lo que está definido; sin orden se usa el del backend (código, ASC).
 */
export function toTrackingParams(query) {
  const { level, adherenceMin, adherenceMax, alerts } = query.filters;

  return {
    ...(level && { nivel_progreso: level }),
    ...(adherenceMin !== null && { adherencia_min: fraction(adherenceMin) }),
    ...(adherenceMax !== null && { adherencia_max: fraction(adherenceMax) }),
    ...(alerts && { con_alertas: alerts }),
    ...(query.sort && { orden_campo: query.sort.field, orden_direccion: query.sort.direction }),
    offset: query.offset,
    limit: query.limit,
  };
}

/*
 * Estado del listado en la URL (?nivel=…&adherencia_min=…&pagina=…), para
 * compartirlo, recargarlo y recorrerlo con atrás y adelante. Solo se leen
 * los parámetros de esta lista, y cada valor pasa por la misma
 * normalización que un cambio en los controles: lo desconocido o
 * inválido se descarta y nunca llega al backend.
 */
export const TRACKING_SEARCH_PARAM = Object.freeze({
  LEVEL: 'nivel',
  ADHERENCE_MIN: 'adherencia_min',
  ADHERENCE_MAX: 'adherencia_max',
  ALERTS: 'alertas',
  SORT_FIELD: 'orden',
  SORT_DIRECTION: 'direccion',
  PAGE: 'pagina',
});

// Límite de páginas aceptado desde la URL; más allá, la primera.
const MAX_SEARCH_PAGE = 10_000;

export function parseTrackingSearch(search) {
  const params = new URLSearchParams(search ?? '');
  const get = (name) => params.get(name);
  const rawPage = get(TRACKING_SEARCH_PARAM.PAGE) ?? '';
  const page = /^[1-9][0-9]{0,4}$/.test(rawPage) ? Number(rawPage) : 1;
  const pageIndex = page <= MAX_SEARCH_PAGE ? page - 1 : 0;

  return normalizeTrackingQuery({
    filters: {
      level: get(TRACKING_SEARCH_PARAM.LEVEL),
      adherenceMin: get(TRACKING_SEARCH_PARAM.ADHERENCE_MIN),
      adherenceMax: get(TRACKING_SEARCH_PARAM.ADHERENCE_MAX),
      alerts: get(TRACKING_SEARCH_PARAM.ALERTS),
    },
    sort: { field: get(TRACKING_SEARCH_PARAM.SORT_FIELD), direction: get(TRACKING_SEARCH_PARAM.SORT_DIRECTION) },
    offset: pageIndex * TRACKING_PAGE_SIZE,
  });
}

// Forma canónica (sin «?»): mismo orden siempre; lo predeterminado se omite.
export function toTrackingSearch(query) {
  const { level, adherenceMin, adherenceMax, alerts } = query.filters;
  const params = new URLSearchParams();
  const page = Math.floor(query.offset / query.limit) + 1;

  if (level) params.set(TRACKING_SEARCH_PARAM.LEVEL, level);
  if (adherenceMin !== null) params.set(TRACKING_SEARCH_PARAM.ADHERENCE_MIN, String(adherenceMin));
  if (adherenceMax !== null) params.set(TRACKING_SEARCH_PARAM.ADHERENCE_MAX, String(adherenceMax));
  if (alerts) params.set(TRACKING_SEARCH_PARAM.ALERTS, alerts);
  if (query.sort) {
    params.set(TRACKING_SEARCH_PARAM.SORT_FIELD, query.sort.field);
    params.set(TRACKING_SEARCH_PARAM.SORT_DIRECTION, query.sort.direction);
  }
  if (page > 1) params.set(TRACKING_SEARCH_PARAM.PAGE, String(page));

  return params.toString();
}

// Orden efectivo: sin orden explícito, el del backend (código, ascendente).
export function effectiveSort(sort) {
  return sort ?? Object.freeze({ field: TRACKING_SORT_FIELD.CODE, direction: SORT_DIRECTION.ASC });
}

// Encabezado de columna: la misma columna invierte la dirección; otra
// empieza en ascendente.
export function nextColumnSort(sort, field) {
  const current = effectiveSort(sort);
  const direction = current.field === field && current.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

  return Object.freeze({ field, direction });
}
