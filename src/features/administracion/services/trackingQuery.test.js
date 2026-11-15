import { describe, expect, it } from 'vitest';

import { TRACKING_PAGE_SIZE } from '../types/participantTracking.js';
import {
  INITIAL_TRACKING_QUERY,
  hasActiveFilters,
  normalizeTrackingQuery,
  sortToValue,
  valueToSort,
  withFilter,
  withPage,
  withSort,
  withoutFilters,
} from './trackingQuery.js';

describe('Parámetros de la consulta de seguimiento (RF-142)', () => {
  it('la consulta inicial no filtra, no ordena y empieza en la primera página', () => {
    expect(INITIAL_TRACKING_QUERY).toEqual({
      filters: { progressMin: null, adherenceMin: null, alerts: null },
      sort: null,
      offset: 0,
      limit: TRACKING_PAGE_SIZE,
    });
    expect(hasActiveFilters(INITIAL_TRACKING_QUERY)).toBe(false);
  });

  it('solo admite umbrales, filtros de alertas, órdenes y offsets conocidos', () => {
    const query = normalizeTrackingQuery({
      filters: { progressMin: '50', adherenceMin: '33', alerts: 'cualquiera', extra: 'x' },
      sort: { field: 'correo', direction: 'asc' },
      offset: -5,
      limit: 1000,
    });

    expect(query).toEqual({
      filters: { progressMin: 50, adherenceMin: null, alerts: null },
      sort: null,
      offset: 0,
      limit: TRACKING_PAGE_SIZE,
    });
  });

  it('un filtro u orden nuevo vuelve a la primera página', () => {
    const onPage2 = normalizeTrackingQuery({ offset: TRACKING_PAGE_SIZE });

    expect(withFilter(onPage2, 'alerts', 'con-alertas')).toMatchObject({ offset: 0, filters: { alerts: 'con-alertas' } });
    expect(withSort(onPage2, { field: 'progreso', direction: 'desc' })).toMatchObject({ offset: 0, sort: { field: 'progreso', direction: 'desc' } });
  });

  it('el valor vacío de un selector quita el filtro', () => {
    const filtered = withFilter(INITIAL_TRACKING_QUERY, 'progressMin', '75');

    expect(hasActiveFilters(filtered)).toBe(true);
    expect(withFilter(filtered, 'progressMin', '').filters.progressMin).toBeNull();
    expect(withoutFilters(withFilter(filtered, 'alerts', 'sin-alertas')).filters).toEqual({ progressMin: null, adherenceMin: null, alerts: null });
  });

  it('pagina por offset y limit sin salirse del total', () => {
    const first = INITIAL_TRACKING_QUERY;
    const second = withPage(first, 1, 12);

    expect(second.offset).toBe(TRACKING_PAGE_SIZE);
    expect(withPage(second, -1, 12).offset).toBe(0);
    expect(withPage(first, -1, 12)).toBe(first);
    expect(withPage(normalizeTrackingQuery({ offset: 10 }), 1, 12)).toMatchObject({ offset: 10 });
    expect(withPage(first, 1, 0)).toBe(first);
  });

  it('convierte el orden a valor de selector y de vuelta', () => {
    expect(sortToValue(null)).toBe('');
    expect(sortToValue({ field: 'adherencia', direction: 'asc' })).toBe('adherencia-asc');
    expect(valueToSort('alertas-desc')).toEqual({ field: 'alertas', direction: 'desc' });
    expect(valueToSort('')).toBeNull();
    expect(valueToSort('nombre-asc')).toBeNull();
  });
});
