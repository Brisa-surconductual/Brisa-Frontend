import { describe, expect, it } from 'vitest';

import { countCohortsByStatus } from './cohortSummary.js';

describe('Resumen de cohortes por estado', () => {
  it('cuenta cada estado y deja en cero los ausentes', () => {
    expect(
      countCohortsByStatus([{ status: 'ACTIVA' }, { status: 'ACTIVA' }, { status: 'BORRADOR' }]),
    ).toEqual({ BORRADOR: 1, ACTIVA: 2, INACTIVA: 0 });
  });

  it('ignora estados desconocidos y listas vacías', () => {
    expect(countCohortsByStatus([{ status: 'OTRO' }])).toEqual({ BORRADOR: 0, ACTIVA: 0, INACTIVA: 0 });
    expect(countCohortsByStatus([])).toEqual({ BORRADOR: 0, ACTIVA: 0, INACTIVA: 0 });
  });
});
