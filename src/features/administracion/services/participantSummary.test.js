import { describe, expect, it } from 'vitest';

import { countParticipantsByStatus } from './participantSummary.js';

describe('countParticipantsByStatus', () => {
  it('cuenta los estados informados e ignora los desconocidos', () => {
    expect(
      countParticipantsByStatus([
        { participationStatus: 'ACTIVO' },
        { participationStatus: 'ACTIVO' },
        { participationStatus: 'PENDIENTE_VALIDACION' },
        { participationStatus: 'INACTIVO' },
        { participationStatus: 'OTRO' },
        {},
      ]),
    ).toEqual({ ACTIVO: 2, INACTIVO: 1, PENDIENTE_VALIDACION: 1 });
  });

  it('solo cuenta: no deduce el estado a partir de registro, consentimiento o línea base', () => {
    const counts = countParticipantsByStatus([
      {
        participationStatus: 'PENDIENTE_VALIDACION',
        registrationStatus: 'COMPLETO',
        consentStatus: 'ACEPTADO',
        baselineStatus: 'REGISTRADA',
      },
    ]);

    expect(counts).toEqual({ ACTIVO: 0, INACTIVO: 0, PENDIENTE_VALIDACION: 1 });
  });

  it('sin participantes todo es cero', () =>
    expect(countParticipantsByStatus([])).toEqual({ ACTIVO: 0, INACTIVO: 0, PENDIENTE_VALIDACION: 0 }));
});
