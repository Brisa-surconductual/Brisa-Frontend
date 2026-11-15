import { describe, expect, it } from 'vitest';

import { SECTION_OUTCOME } from '../types/participantEngagement.js';
import { TRACKING_ACCESS } from '../types/participantTracking.js';
import { formatElapsedTime } from '../utils/formatElapsedTime.js';
import { interpretTemporalLocationResponse } from './temporalLocationResponse.js';

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

const FULL = Object.freeze({
  currentUnitName: 'Unidad 3',
  effectiveElapsedSeconds: 1576800,
  programFinished: false,
  pauses: [{ status: 'ACTIVA', startsAt: '2026-03-06T00:00:00-05:00', endsAt: '2026-03-13T23:59:00-05:00', reason: 'Motivo privado', pauseId: 'uuid-pausa' }],
  scheduleId: 'uuid-cronograma',
  currentUnitId: 'uuid-unidad',
  programStartDate: '2026-01-26T00:00:00-05:00',
});

const response = (temporal, changes = {}) => ({ access: TRACKING_ACCESS.GRANTED, ...REQUEST, temporal, ...changes });
const interpret = (value) => interpretTemporalLocationResponse(value, REQUEST);

describe('Consulta temporal (M04: RF-22 y RF-22B)', () => {
  it('autorizada: unidad vigente, tiempo efectivo, cronograma finalizado y pausas (estado y fechas)', () => {
    const result = interpret(response(FULL, { email: 'x@example.com', participantId: 'interno' }));

    expect(result).toEqual({
      outcome: SECTION_OUTCOME.OK,
      data: {
        currentUnitName: 'Unidad 3',
        effectiveElapsedSeconds: 1576800,
        programFinished: false,
        pauses: [{ status: 'ACTIVA', startsAt: '2026-03-06T00:00:00-05:00', endsAt: '2026-03-13T23:59:00-05:00' }],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/uuid|Motivo|programStart|2026-01-26|@|interno|ref-1/);
  });

  it.each([
    ['DENEGADO', response(FULL, { access: TRACKING_ACCESS.DENIED }), SECTION_OUTCOME.DENIED],
    ['sin acceso declarado', response(FULL, { access: undefined }), SECTION_OUTCOME.DENIED],
    ['otro participante', response(FULL, { reference: 'ref-2' }), SECTION_OUTCOME.INCONSISTENT],
    ['otra cohorte', response(FULL, { cohortId: 'c-2' }), SECTION_OUTCOME.INCONSISTENT],
    ['sin cronograma', response(null), SECTION_OUTCOME.EMPTY],
    ['forma inválida', response('unidad'), SECTION_OUTCOME.MALFORMED],
  ])('%s: sin datos', (_, value, outcome) => {
    expect(interpret(value)).toEqual({ outcome });
  });

  it('valores ausentes o inválidos quedan en null; nada se calcula ni se completa', () => {
    const { data } = interpret(response({ currentUnitName: ' ', effectiveElapsedSeconds: -5, programFinished: 'no', pauses: 'x' }));

    expect(data).toEqual({ currentUnitName: null, effectiveElapsedSeconds: null, programFinished: null, pauses: null });
    expect(interpret(response({ effectiveElapsedSeconds: 10.5 })).data.effectiveElapsedSeconds).toBeNull();
  });

  it('distingue cero, pausas vacías y no disponibles, y cronograma finalizado', () => {
    const { data } = interpret(response({ effectiveElapsedSeconds: 0, programFinished: true, pauses: [] }));

    expect(data).toMatchObject({ effectiveElapsedSeconds: 0, programFinished: true, pauses: [] });
  });

  it('una pausa con forma inválida se conserva sin inventar estado ni fechas', () => {
    expect(interpret(response({ pauses: ['x', { status: 'SUSPENDIDA' }] })).data.pauses).toEqual([
      { status: null, startsAt: null, endsAt: null },
      { status: 'SUSPENDIDA', startsAt: null, endsAt: null },
    ]);
  });
});

describe('Presentación del tiempo efectivo transcurrido', () => {
  it.each([
    [0, 'Menos de 1 hora'],
    [3599, 'Menos de 1 hora'],
    [3600, '1 hora'],
    [3 * 3600, '3 horas'],
    [86400, '1 día'],
    [18 * 86400 + 6 * 3600, '18 días y 6 horas'],
    [86400 + 3600 + 59, '1 día y 1 hora'],
  ])('%s s: «%s» (sin redondear hacia arriba)', (seconds, label) => {
    expect(formatElapsedTime(seconds)).toBe(label);
  });

  it.each([[-1], [1.5], [null], ['3600']])('%s: no disponible', (value) => {
    expect(formatElapsedTime(value)).toBeNull();
  });
});
