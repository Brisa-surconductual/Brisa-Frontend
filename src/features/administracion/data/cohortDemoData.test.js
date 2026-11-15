import { describe, expect, it } from 'vitest';

import { validateCohortForm } from '../services/cohortValidation.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';
import { DEMO_COHORTS } from './cohortDemoData.js';

const ALLOWED_FIELDS = ['id', 'name', 'startDate', 'endDate', 'status', 'scheduleId', 'scheduleName'];

describe('Datos ficticios de demostración', () => {
  it('cubre los tres estados de RF-124', () => {
    expect(DEMO_COHORTS.map(({ status }) => status).sort()).toEqual(
      Object.values(COHORT_STATUS).sort(),
    );
  });

  it('cada cohorte cumple las validaciones de E1', () => {
    for (const cohort of DEMO_COHORTS) {
      expect(validateCohortForm(cohort), cohort.name).toEqual({});
    }
  });

  it('solo contiene campos de cohorte, sin datos personales ni clínicos', () => {
    for (const cohort of DEMO_COHORTS) {
      expect(Object.keys(cohort).every((key) => ALLOWED_FIELDS.includes(key))).toBe(true);
    }
    expect(JSON.stringify(DEMO_COHORTS)).not.toMatch(/@|correo|email|dependencia|craving|consumo/i);
  });

  it('es determinista e inmutable', () => {
    expect(Object.isFrozen(DEMO_COHORTS)).toBe(true);
    expect(DEMO_COHORTS.every(Object.isFrozen)).toBe(true);
    expect(DEMO_COHORTS.map(({ name }) => name)).toEqual([
      'Cohorte Piloto A',
      'Cohorte Piloto B',
      'Cohorte Piloto C',
    ]);
  });
});
