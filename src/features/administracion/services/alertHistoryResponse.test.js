import { describe, expect, it } from 'vitest';

import { ALERT_HISTORY_OUTCOME, TRACKING_ACCESS } from '../types/participantTracking.js';
import { interpretAlertHistoryResponse } from './alertHistoryResponse.js';

const REQUEST = Object.freeze({ cohortId: 'c-1', reference: 'ref-1' });

const alert = (changes = {}) => ({
  reference: 'ref-1',
  type: 'CRAVING_ELEVADO',
  source: 'RF-63',
  generatedAt: '2026-03-07T21:15:00-05:00',
  status: 'ACTIVA',
  resolvedAt: null,
  ...changes,
});

const response = (changes = {}) => ({
  access: TRACKING_ACCESS.GRANTED,
  cohortId: 'c-1',
  reference: 'ref-1',
  alerts: [alert()],
  ...changes,
});

const interpret = (value) => interpretAlertHistoryResponse(value, REQUEST);

describe('Historial de alertas (RF-129): autorización explícita propia', () => {
  it.each([
    ['DENEGADO', response({ access: TRACKING_ACCESS.DENIED })],
    ['sin campo de acceso', response({ access: undefined })],
    ['valor desconocido', response({ access: 'SI' })],
    ['respuesta vacía', null],
  ])('%s: denegado y sin ningún registro, aunque la respuesta los traiga', (_, value) => {
    expect(interpret(value)).toEqual({ outcome: ALERT_HISTORY_OUTCOME.DENIED });
  });
});

describe('Aislamiento por participante y cohorte', () => {
  it.each([
    ['otra referencia', response({ reference: 'ref-2' })],
    ['otra cohorte', response({ cohortId: 'c-2' })],
    ['una alerta de otro participante', response({ alerts: [alert(), alert({ reference: 'ref-2' })] })],
    ['una alerta sin participante declarado', response({ alerts: [alert({ reference: undefined })] })],
    ['un registro que no es objeto', response({ alerts: [alert(), 'texto'] })],
  ])('%s: bloquea el historial completo', (_, value) => {
    expect(interpret(value)).toEqual({ outcome: ALERT_HISTORY_OUTCOME.INCONSISTENT });
  });
});

describe('Resultados', () => {
  it.each([
    ['lista vacía', []],
    ['sin lista', null],
    ['campo ausente', undefined],
  ])('%s: sin alertas registradas (204)', (_, alerts) => {
    expect(interpret(response({ alerts }))).toEqual({ outcome: ALERT_HISTORY_OUTCOME.EMPTY, alerts: [] });
  });

  it('una lista con forma inválida es un error, no un historial vacío', () => {
    expect(interpret(response({ alerts: { 0: alert() } }))).toEqual({ outcome: ALERT_HISTORY_OUTCOME.MALFORMED });
  });

  it('lista explícita de campos: descarta UUID, notas, niveles de craving y la referencia', () => {
    const result = interpret(response({
      alerts: [alert({ alertId: '8f1c2d3e-0000-4000-8000-000000000001', notes: 'texto', cravingLevel: 9, email: 'x@example.com' })],
      participantId: 'interno',
    }));

    expect(result.outcome).toBe(ALERT_HISTORY_OUTCOME.OK);
    expect(Object.keys(result.alerts[0]).sort()).toEqual(['generatedAt', 'resolvedAt', 'source', 'status', 'type']);
    expect(JSON.stringify(result)).not.toMatch(/8f1c2d3e|texto|cravingLevel|@|interno|ref-1/);
  });

  it('conserva los valores originales, también los desconocidos, y normaliza los vacíos a null', () => {
    const [value] = interpret(response({ alerts: [alert({ type: 'RECAIDA', source: ' ', status: 'ARCHIVADA', resolvedAt: '' })] })).alerts;

    expect(value).toEqual({ type: 'RECAIDA', source: null, generatedAt: '2026-03-07T21:15:00-05:00', status: 'ARCHIVADA', resolvedAt: null });
  });

  it('ordena cronológicamente por fecha de generación', () => {
    const result = interpret(response({
      alerts: [
        alert({ generatedAt: '2026-03-07T21:15:00-05:00' }),
        alert({ generatedAt: 'sin-fecha' }),
        alert({ generatedAt: '2026-02-01T10:00:00Z' }),
      ],
    }));

    expect(result.alerts.map(({ generatedAt }) => generatedAt)).toEqual(['2026-02-01T10:00:00Z', '2026-03-07T21:15:00-05:00', 'sin-fecha']);
  });

  it('el resultado es inmutable', () => {
    const result = interpret(response());

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.alerts)).toBe(true);
    expect(Object.isFrozen(result.alerts[0])).toBe(true);
  });
});
