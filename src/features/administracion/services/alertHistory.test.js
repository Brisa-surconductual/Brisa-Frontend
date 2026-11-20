import { describe, expect, it } from 'vitest';

import {
  RESOLUTION_DISPLAY,
  hasActiveSummaryMismatch,
  resolutionDisplay,
  sortAlertsChronologically,
} from './alertHistory.js';

describe('Orden cronológico (RF-129)', () => {
  it('de la más antigua a la más reciente, comparando instantes y no textos', () => {
    const alerts = [
      { id: 'b', generatedAt: '2026-03-01T00:30:00-05:00' },
      { id: 'a', generatedAt: '2026-03-01T04:00:00Z' },
      { id: 'c', generatedAt: '2026-02-28T23:59:00-05:00' },
    ];

    expect(sortAlertsChronologically(alerts).map(({ id }) => id)).toEqual(['a', 'c', 'b']);
  });

  it('las fechas ausentes, inválidas o sin zona van al final en el orden recibido', () => {
    const alerts = [
      { id: 'sin-zona', generatedAt: '2026-01-01T10:00:00' },
      { id: 'valida', generatedAt: '2026-03-01T10:00:00Z' },
      { id: 'nula', generatedAt: null },
      { id: 'invalida', generatedAt: '2026-13-45T99:00:00Z' },
    ];

    expect(sortAlertsChronologically(alerts).map(({ id }) => id)).toEqual(['valida', 'sin-zona', 'nula', 'invalida']);
  });

  it('a igual fecha conserva el orden recibido y no modifica la lista original', () => {
    const alerts = Object.freeze([
      { id: 'x', generatedAt: '2026-03-01T10:00:00Z' },
      { id: 'y', generatedAt: '2026-03-01T05:00:00-05:00' },
    ]);

    expect(sortAlertsChronologically(alerts).map(({ id }) => id)).toEqual(['x', 'y']);
  });
});

describe('Fecha de resolución: nunca se inventa', () => {
  it.each([
    ['con fecha válida', { status: 'RESUELTA', resolvedAt: '2026-03-01T10:00:00Z' }, RESOLUTION_DISPLAY.DATE],
    ['con fecha inválida', { status: 'RESUELTA', resolvedAt: 'fecha-invalida' }, RESOLUTION_DISPLAY.UNAVAILABLE],
    ['con fecha sin zona', { status: 'DESCARTADA', resolvedAt: '2026-03-01 10:00' }, RESOLUTION_DISPLAY.UNAVAILABLE],
    ['resuelta sin fecha', { status: 'RESUELTA', resolvedAt: null }, RESOLUTION_DISPLAY.NOT_RECORDED],
    ['descartada sin fecha', { status: 'DESCARTADA', resolvedAt: null }, RESOLUTION_DISPLAY.NOT_RECORDED],
    ['activa sin fecha', { status: 'ACTIVA', resolvedAt: null }, RESOLUTION_DISPLAY.NONE],
    ['en revisión sin fecha', { status: 'EN_REVISION', resolvedAt: null }, RESOLUTION_DISPLAY.NONE],
    ['estado desconocido sin fecha', { status: 'ARCHIVADA', resolvedAt: null }, RESOLUTION_DISPLAY.NONE],
  ])('%s', (_, alert, display) => {
    expect(resolutionDisplay(alert)).toBe(display);
  });
});

describe('Coherencia entre el resumen de alertas activas (RF-128) y el historial', () => {
  const craving = { type: 'CRAVING_ELEVADO', generatedAt: '2026-03-07T21:15:00-05:00' };
  const inactivity = { type: 'INACTIVIDAD', generatedAt: '2026-03-05T07:30:00-05:00' };
  const withStatus = (alert, status) => ({ ...alert, status, source: null, resolvedAt: null });

  it('coinciden cuando las ACTIVA del historial son las del resumen; las demás no cuentan', () => {
    const history = [
      withStatus(inactivity, 'ACTIVA'),
      withStatus(craving, 'ACTIVA'),
      withStatus({ type: 'CRAVING_ELEVADO', generatedAt: '2026-02-01T00:00:00Z' }, 'RESUELTA'),
      withStatus({ type: 'INACTIVIDAD', generatedAt: '2026-02-02T00:00:00Z' }, 'DESCARTADA'),
      withStatus({ type: 'INACTIVIDAD', generatedAt: '2026-02-03T00:00:00Z' }, 'EN_REVISION'),
    ];

    expect(hasActiveSummaryMismatch([craving, inactivity], history)).toBe(false);
    expect(hasActiveSummaryMismatch([], [withStatus(craving, 'RESUELTA')])).toBe(false);
  });

  it.each([
    ['falta una activa en el historial', [craving, inactivity], [withStatus(craving, 'ACTIVA')]],
    ['sobra una activa en el historial', [craving], [withStatus(craving, 'ACTIVA'), withStatus(inactivity, 'ACTIVA')]],
    ['misma cantidad, distinta alerta', [craving], [withStatus(inactivity, 'ACTIVA')]],
    ['la activa del resumen figura resuelta', [craving], [withStatus(craving, 'RESUELTA')]],
    ['repetida en el resumen', [craving, craving], [withStatus(craving, 'ACTIVA')]],
  ])('difieren: %s', (_, summary, history) => {
    expect(hasActiveSummaryMismatch(summary, history)).toBe(true);
  });

  it('sin resumen o sin historial no hay comparación', () => {
    expect(hasActiveSummaryMismatch(null, [withStatus(craving, 'ACTIVA')])).toBe(false);
    expect(hasActiveSummaryMismatch([craving], null)).toBe(false);
  });
});
