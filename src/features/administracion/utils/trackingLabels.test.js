import { describe, expect, it } from 'vitest';

import { PROGRESS_LEVEL_OPTIONS, adherenceLabel, adherencePercent, progressLevelLabel } from './trackingLabels.js';

describe('Presentación de indicadores de seguimiento', () => {
  it.each([
    ['INICIAL', 'Inicial'],
    ['EN_AVANCE', 'En avance'],
    ['AVANZADO', 'Avanzado'],
    ['COMPLETADO', 'Completado'],
  ])('nivel %s como categoría: «%s»', (level, label) => {
    expect(progressLevelLabel(level)).toBe(label);
  });

  it('nivel ausente o desconocido: nunca crudo ni como porcentaje', () => {
    expect(progressLevelLabel(null)).toBe('No disponible');
    expect(progressLevelLabel('EXPERTO')).toBe('Nivel no reconocido');
    expect(PROGRESS_LEVEL_OPTIONS.map(({ label }) => label)).toEqual(['Inicial', 'En avance', 'Avanzado', 'Completado']);
  });

  it.each([
    [0.41, '41 %', 41],
    [0, '0 %', 0],
    [1, '100 %', 100],
    [0.666, '67 %', 67],
  ])('adherencia %s → %s, solo en la presentación', (fraction, label, percent) => {
    expect(adherenceLabel(fraction)).toBe(label);
    expect(adherencePercent(fraction)).toBe(percent);
  });

  it('adherencia ausente: no disponible, nunca 0 %', () => {
    expect(adherenceLabel(null)).toBe('No disponible');
    expect(adherencePercent(null)).toBeNull();
    expect(adherencePercent(undefined)).toBeNull();
  });
});
