import { describe, expect, it } from 'vitest';

import { formatCohortDate } from './formatCohortDate.js';

describe('Formato de fechas de cohorte', () => {
  it.each([
    ['2026-02-01', '1 de feb de 2026'],
    ['2026-12-31', '31 de dic de 2026'],
    ['2026-01-01', '1 de ene de 2026'],
  ])('%s se muestra como %s, sin cambiar de día', (value, expected) =>
    expect(formatCohortDate(value)).toBe(expected));

  it.each([[''], [null], [undefined], ['2026-02-30'], ['2026-02-01T05:00:00Z']])(
    'devuelve null para %j',
    (value) => expect(formatCohortDate(value)).toBeNull(),
  );
});
