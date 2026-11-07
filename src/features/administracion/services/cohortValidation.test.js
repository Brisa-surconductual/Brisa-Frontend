import { describe, expect, it } from 'vitest';

import {
  getActiveSchedules,
  validateCohortForm,
  validateCohortSchedule,
} from './cohortValidation.js';

const VALID = Object.freeze({
  name: 'Cohorte de prueba',
  startDate: '2026-02-01',
  endDate: '2026-05-31',
});

const validate = (changes) => validateCohortForm({ ...VALID, ...changes });

describe('Validación del formulario de cohorte (RF-124)', () => {
  it('acepta una cohorte completa y coherente', () => {
    expect(validate({})).toEqual({});
  });

  describe('nombre', () => {
    it.each([[''], ['   '], ['\t\n']])('es obligatorio (%j)', (name) => {
      expect(validate({ name })).toEqual({
        name: 'El nombre de la cohorte es obligatorio.',
      });
    });

    it('acepta un nombre con espacios alrededor', () => {
      expect(validate({ name: '  Cohorte 2026-1  ' })).toEqual({});
    });
  });

  describe('fechas obligatorias y válidas', () => {
    it('exige ambas fechas', () => {
      expect(validate({ startDate: '', endDate: '' })).toEqual({
        startDate: 'La fecha de inicio del programa es obligatoria.',
        endDate: 'La fecha de finalización del programa es obligatoria.',
      });
    });

    it.each([
      ['01/02/2026'],
      ['2026-2-1'],
      ['2026-02-30'],
      ['2025-02-29'],
      ['texto'],
    ])('rechaza la fecha de inicio %s', (startDate) => {
      expect(validate({ startDate })).toEqual({
        startDate: 'Ingresa una fecha de inicio válida.',
      });
    });

    it('rechaza una fecha de finalización inexistente', () => {
      expect(validate({ endDate: '2026-04-31' })).toEqual({
        endDate: 'Ingresa una fecha de finalización válida.',
      });
    });

    it('acepta el 29 de febrero de un año bisiesto', () => {
      expect(validate({ startDate: '2028-02-29', endDate: '2028-03-01' })).toEqual({});
    });
  });

  describe('orden de las fechas', () => {
    it('rechaza una fecha final anterior a la inicial', () => {
      expect(validate({ startDate: '2026-05-31', endDate: '2026-05-30' })).toEqual({
        endDate:
          'La fecha de finalización del programa no puede ser anterior a la fecha de inicio.',
      });
    });

    it('permite que ambas fechas coincidan', () => {
      expect(validate({ startDate: '2026-05-31', endDate: '2026-05-31' })).toEqual({});
    });

    it('compara días de calendario, no horas locales, en cambios de mes y año', () => {
      expect(validate({ startDate: '2026-03-01', endDate: '2026-02-28' }).endDate).toBeDefined();
      expect(validate({ startDate: '2025-12-31', endDate: '2026-01-01' })).toEqual({});
    });

    it('no compara el orden si alguna fecha es inválida', () => {
      expect(validate({ startDate: '2026-13-01', endDate: '2026-01-01' })).toEqual({
        startDate: 'Ingresa una fecha de inicio válida.',
      });
    });
  });

  it('reporta varios errores a la vez', () => {
    expect(Object.keys(validateCohortForm({}))).toEqual(['name', 'startDate', 'endDate']);
  });
});

describe('Cronograma asociado (RF-124)', () => {
  const SCHEDULES = Object.freeze([
    Object.freeze({ id: 's-activo', name: 'Activo', status: 'ACTIVO' }),
    Object.freeze({ id: 's-inactivo', name: 'Inactivo', status: 'INACTIVO' }),
  ]);

  it('solo ofrece cronogramas activos', () => {
    expect(getActiveSchedules(SCHEDULES).map(({ id }) => id)).toEqual(['s-activo']);
    expect(getActiveSchedules()).toEqual([]);
  });

  it('acepta un cronograma activo', () => {
    expect(validateCohortSchedule('s-activo', SCHEDULES)).toEqual({});
  });

  it('exige seleccionar un cronograma', () => {
    expect(validateCohortSchedule('', SCHEDULES)).toEqual({
      scheduleId: 'Selecciona el cronograma asociado.',
    });
  });

  it.each([['s-inactivo'], ['no-existe']])('rechaza %s: no es un cronograma activo', (scheduleId) => {
    expect(validateCohortSchedule(scheduleId, SCHEDULES)).toEqual({
      scheduleId: 'La cohorte debe asociarse a un cronograma psicoeducativo activo.',
    });
  });

  it('sin cronogramas activos ninguna selección es válida', () => {
    expect(validateCohortSchedule('s-activo', [SCHEDULES[1]]).scheduleId).toBeDefined();
  });
});
