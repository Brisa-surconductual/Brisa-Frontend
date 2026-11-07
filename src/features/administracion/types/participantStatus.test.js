import { describe, expect, it } from 'vitest';

import {
  BASELINE_STATUS,
  CONSENT_STATUS,
  PARTICIPATION_STATUS,
  REGISTRATION_STATUS,
} from './participantStatus.js';

describe('Estados de participantes (RF-125)', () => {
  it.each([
    ['participación', PARTICIPATION_STATUS, ['ACTIVO', 'INACTIVO', 'PENDIENTE_VALIDACION']],
    ['registro', REGISTRATION_STATUS, ['PENDIENTE', 'COMPLETO', 'INCOMPLETO']],
    ['consentimiento', CONSENT_STATUS, ['ACEPTADO', 'NO_ACEPTADO', 'PENDIENTE']],
    ['línea base', BASELINE_STATUS, ['REGISTRADA', 'NO_REGISTRADA', 'PENDIENTE']],
  ])('%s usa exactamente los valores de RF-125 y es inmutable', (_, catalog, values) => {
    expect(Object.values(catalog)).toEqual(values);
    expect(Object.isFrozen(catalog)).toBe(true);
  });

  it('no adopta los estados de registro de M01 como si fueran los de RF-125', () => {
    for (const value of ['PENDIENTE_CONSENTIMIENTO', 'PENDIENTE_REVISION', 'REGISTRO_COMPLETO']) {
      expect(Object.values(REGISTRATION_STATUS)).not.toContain(value);
    }
  });
});
