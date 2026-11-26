import { describe, expect, it } from 'vitest';

import {
  INITIAL_TRACKING_QUERY,
  hasActiveFilters,
  lastPageOffset,
  normalizeTrackingQuery,
  sortToValue,
  toTrackingParams,
  valueToSort,
  withFilter,
  withOffset,
  withPage,
  withSort,
  withoutFilters,
} from './trackingQuery.js';

describe('trackingQuery (RF-142, parámetros reales)', () => {
  it('consulta inicial: sin filtros, orden del backend, primera página de 20', () => {
    expect(INITIAL_TRACKING_QUERY).toEqual({
      filters: { level: null, adherenceMin: null, adherenceMax: null, alerts: null },
      sort: null,
      offset: 0,
      limit: 20,
    });
    expect(toTrackingParams(INITIAL_TRACKING_QUERY)).toEqual({ offset: 0, limit: 20 });
  });

  it('filtros combinados, orden y paginación con los nombres del backend', () => {
    let query = withFilter(INITIAL_TRACKING_QUERY, 'level', 'EN_AVANCE');
    query = withFilter(query, 'adherenceMin', '25');
    query = withFilter(query, 'adherenceMax', '75');
    query = withFilter(query, 'alerts', 'true');
    query = withSort(query, valueToSort('tasa_adherencia:DESC'));
    query = withPage(query, 1, 45);

    expect(toTrackingParams(query)).toEqual({
      nivel_progreso: 'EN_AVANCE',
      adherencia_min: 0.25,
      adherencia_max: 0.75,
      con_alertas: 'true',
      orden_campo: 'tasa_adherencia',
      orden_direccion: 'DESC',
      offset: 20,
      limit: 20,
    });
  });

  it('con_alertas=false también se envía', () => {
    expect(toTrackingParams(withFilter(INITIAL_TRACKING_QUERY, 'alerts', 'false')).con_alertas).toBe('false');
  });

  it.each([
    ['nivel desconocido', 'level', 'EXPERTO'],
    ['umbral no ofrecido', 'adherenceMin', '33'],
    ['umbral negativo', 'adherenceMax', '-25'],
    ['alertas desconocidas', 'alerts', 'si'],
  ])('ignora valores no admitidos (%s): nunca los reenvía', (_, name, value) => {
    expect(toTrackingParams(withFilter(INITIAL_TRACKING_QUERY, name, value))).toEqual({ offset: 0, limit: 20 });
  });

  it('mínimo mayor que el máximo: se descarta el otro límite, nunca se envía un rango inválido', () => {
    const withMax = withFilter(INITIAL_TRACKING_QUERY, 'adherenceMax', '25');
    const conflict = withFilter(withMax, 'adherenceMin', '75');

    expect(conflict.filters).toMatchObject({ adherenceMin: 75, adherenceMax: null });
    expect(withFilter(withFilter(INITIAL_TRACKING_QUERY, 'adherenceMin', '75'), 'adherenceMax', '25').filters)
      .toMatchObject({ adherenceMin: null, adherenceMax: 25 });
    expect(normalizeTrackingQuery({ filters: { adherenceMin: 75, adherenceMax: 25 } }).filters.adherenceMax).toBeNull();
  });

  it('un cambio de filtro u orden vuelve a la primera página', () => {
    const second = withPage(INITIAL_TRACKING_QUERY, 1, 45);

    expect(withFilter(second, 'level', 'INICIAL').offset).toBe(0);
    expect(withSort(second, valueToSort('alertas_activas:ASC')).offset).toBe(0);
  });

  it('orden: valores del selector y desconocidos', () => {
    expect(sortToValue(valueToSort('alertas_atendidas:DESC'))).toBe('alertas_atendidas:DESC');
    expect(valueToSort('correo:ASC')).toBeNull();
    expect(valueToSort('tasa_adherencia:asc')).toBeNull();
    expect(valueToSort('')).toBeNull();
  });

  it('paginación: no pasa de los extremos', () => {
    expect(withPage(INITIAL_TRACKING_QUERY, -1, 45)).toBe(INITIAL_TRACKING_QUERY);
    const last = withPage(withPage(INITIAL_TRACKING_QUERY, 1, 45), 1, 45);
    expect(last.offset).toBe(40);
    expect(withPage(last, 1, 45)).toBe(last);
  });

  it('última página que existe', () => {
    expect(lastPageOffset(41, 20)).toBe(40);
    expect(lastPageOffset(40, 20)).toBe(20);
    expect(lastPageOffset(0, 20)).toBe(0);
    expect(withOffset(INITIAL_TRACKING_QUERY, 40).offset).toBe(40);
  });

  it('limpiar filtros conserva el orden', () => {
    const query = withSort(withFilter(INITIAL_TRACKING_QUERY, 'level', 'AVANZADO'), valueToSort('nivel_progreso:ASC'));

    expect(hasActiveFilters(query)).toBe(true);
    expect(withoutFilters(query)).toMatchObject({ filters: INITIAL_TRACKING_QUERY.filters, sort: { field: 'nivel_progreso', direction: 'ASC' } });
    expect(hasActiveFilters(withoutFilters(query))).toBe(false);
  });
});
