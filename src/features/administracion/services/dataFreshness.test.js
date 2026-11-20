import { describe, expect, it } from 'vitest';

import { FRESHNESS_STATE } from '../types/dataFreshness.js';
import { CURRENT_FRESHNESS, freshnessBlockingStatus, interpretFreshness, isStale } from './dataFreshness.js';

describe('Marca de modo degradado (RF-149)', () => {
  it.each([
    ['sin marca', {}],
    ['marca ACTUAL', { dataState: 'ACTUAL' }],
    ['marca nula', { dataState: null }],
    ['respuesta vacía', null],
  ])('%s: datos actuales', (_, response) => {
    expect(interpretFreshness(response)).toEqual(CURRENT_FRESHNESS);
  });

  it('DEGRADADO con fecha ISO 8601 con zona: desactualizado con esa fecha exacta', () => {
    expect(interpretFreshness({ dataState: 'DEGRADADO', lastAvailableAt: '2026-03-08T14:30:00-05:00' }))
      .toEqual({ state: FRESHNESS_STATE.STALE, lastAvailableAt: '2026-03-08T14:30:00-05:00' });
    expect(interpretFreshness({ dataState: 'DEGRADADO', lastAvailableAt: '2023-10-25T14:30:00Z' }).state).toBe(FRESHNESS_STATE.STALE);
  });

  it.each([
    ['sin fecha', undefined],
    ['fecha vacía', ' '],
    ['fecha sin zona', '2026-03-08 14:30'],
    ['fecha inválida', '2026-13-45T99:00:00Z'],
    ['fecha numérica', 1700000000000],
  ])('DEGRADADO %s: sin fecha confiable (no se inventa la antigüedad)', (_, lastAvailableAt) => {
    expect(interpretFreshness({ dataState: 'DEGRADADO', lastAvailableAt })).toEqual({ state: FRESHNESS_STATE.STALE_UNDATED, lastAvailableAt: null });
  });

  it('una marca desconocida no se interpreta como actual', () => {
    expect(interpretFreshness({ dataState: 'PARCIAL' }).state).toBe(FRESHNESS_STATE.INVALID);
  });

  it('qué marca bloquea la sección y cuál se muestra con advertencia', () => {
    expect(freshnessBlockingStatus(CURRENT_FRESHNESS)).toBeNull();
    expect(freshnessBlockingStatus({ state: FRESHNESS_STATE.STALE, lastAvailableAt: 'x' })).toBeNull();
    expect(freshnessBlockingStatus({ state: FRESHNESS_STATE.STALE_UNDATED })).toBe('STALE_UNDATED');
    expect(freshnessBlockingStatus({ state: FRESHNESS_STATE.INVALID })).toBe('ERROR');
    expect(isStale({ state: FRESHNESS_STATE.STALE })).toBe(true);
    expect(isStale(CURRENT_FRESHNESS)).toBe(false);
    expect(isStale(undefined)).toBe(false);
  });
});
