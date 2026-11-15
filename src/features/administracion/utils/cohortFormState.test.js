import { describe, expect, it } from 'vitest';

import {
  COHORT_FORM_FIELDS,
  INITIAL_COHORT_FORM,
  firstInvalidField,
  normalizeCohortForm,
  toCohortForm,
} from './cohortFormState.js';

describe('Estado del formulario de cohorte', () => {
  it('empieza vacío e inmutable', () => {
    expect(INITIAL_COHORT_FORM).toEqual({ name: '', startDate: '', endDate: '', scheduleId: '' });
    expect(Object.isFrozen(INITIAL_COHORT_FORM)).toBe(true);
  });

  it('precarga solo los campos editables de una cohorte existente', () => {
    expect(
      toCohortForm({
        id: 'x',
        name: 'Cohorte',
        startDate: '2026-01-05',
        endDate: '2026-04-30',
        scheduleId: 's-1',
        status: 'ACTIVA',
        scheduleName: 'Uno',
      }),
    ).toEqual({ name: 'Cohorte', startDate: '2026-01-05', endDate: '2026-04-30', scheduleId: 's-1' });
    expect(toCohortForm(null)).toEqual(INITIAL_COHORT_FORM);
  });

  it('normaliza el nombre sin espacios sobrantes', () => {
    expect(
      normalizeCohortForm({ name: '  Cohorte 2026  ', startDate: '2026-01-05', endDate: '2026-01-05', scheduleId: 's-1' }),
    ).toEqual({ name: 'Cohorte 2026', startDate: '2026-01-05', endDate: '2026-01-05', scheduleId: 's-1' });
  });

  it('el primer campo con error sigue el orden visual del formulario', () => {
    expect(COHORT_FORM_FIELDS).toEqual(['name', 'startDate', 'endDate', 'scheduleId']);
    expect(firstInvalidField({ scheduleId: 'x', endDate: 'y' })).toBe('endDate');
    expect(firstInvalidField({})).toBeNull();
  });
});
