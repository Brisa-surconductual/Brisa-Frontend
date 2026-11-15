import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretFreshness } from '../services/dataFreshness.js';
import { interpretTemporalLocationResponse } from '../services/temporalLocationResponse.js';
import { FRESHNESS_STATE } from '../types/dataFreshness.js';
import { SECTION_OUTCOME } from '../types/participantEngagement.js';
import { TRACKING_ACCESS, TRACKING_QUERY_ERROR } from '../types/participantTracking.js';
import { getTemporalDemoScenario } from '../utils/temporalLocationDemoScenario.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { DEMO_LAST_AVAILABLE_AT } from './degradedDemo.js';
import { getParticipantNarrativeProgress, getParticipantNotificationInteraction } from './engagementSource.js';
import { removeCohortParticipant } from './participantSource.js';
import { DEMO_TEMPORAL_LOCATION } from './temporalLocationDemoData.js';
import { getParticipantTemporalLocation } from './temporalLocationSource.js';
import { DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';
import { getParticipantAlertHistory, getParticipantTrackingProfile } from './trackingSource.js';

function enableDemo(variables = {}) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  for (const [name, value] of Object.entries(variables)) vi.stubEnv(name, value);
}

const COHORT = 'demo-cohorte-b';
const REF = (n) => DEMO_TRACKING_REFERENCES[`demo-participante-${n}`];
const codeOf = async (promise) => (await promise.catch((error) => error)).code;
const temporalOf = async (reference, cohortId = COHORT) =>
  interpretTemporalLocationResponse(await getParticipantTemporalLocation(cohortId, reference), { cohortId, reference });

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // Ninguna consulta hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Consulta temporal M04 de demostración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: rechaza sin datos ficticios', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    await expect(getParticipantTemporalLocation(COHORT, REF(4))).rejects.toThrow('no está integrada');
  });

  it('autorizada; la interpretación descarta UUID, motivo de pausas, fecha de inicio y correos', async () => {
    enableDemo();
    const raw = await getParticipantTemporalLocation(COHORT, REF(4));
    const result = interpretTemporalLocationResponse(raw, { cohortId: COHORT, reference: REF(4) });

    expect(JSON.stringify(raw)).toMatch(/Motivo ficticio|00000000-|programStartDate|@example\.com/);
    expect(result.outcome).toBe(SECTION_OUTCOME.OK);
    expect(result.data.pauses.map(({ status }) => status)).toEqual(['ACTIVA', 'FINALIZADA', 'ANULADA']);
    expect(JSON.stringify(result)).not.toMatch(/Motivo|00000000-|programStart|@|demo-participante/);
  });

  it('casos de los datos: sin cronograma, finalizado, pausas no disponibles e inválidos', async () => {
    enableDemo();

    expect((await temporalOf(REF(5))).outcome).toBe(SECTION_OUTCOME.EMPTY);
    expect((await temporalOf(REF(6))).data.pauses).toBeNull();
    expect((await temporalOf(REF(7), 'demo-cohorte-c')).data.programFinished).toBe(true);
    expect((await temporalOf(REF(8), 'demo-cohorte-c')).data).toMatchObject({ currentUnitName: null, effectiveElapsedSeconds: null, programFinished: null });
  });

  it.each([
    ['sin-datos', SECTION_OUTCOME.EMPTY],
    ['denegado', SECTION_OUTCOME.DENIED],
    ['otro-participante', SECTION_OUTCOME.INCONSISTENT],
    ['otra-cohorte', SECTION_OUTCOME.INCONSISTENT],
  ])('escenario %s', async (scenario, outcome) => {
    enableDemo({ VITE_M08_TEMPORAL_SCENARIO: scenario });

    expect((await temporalOf(REF(4))).outcome).toBe(outcome);
  });

  it.each([
    ['inexistente', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['no-disponible', TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE],
    ['error', undefined],
  ])('escenario %s: rechaza con su código', async (scenario, code) => {
    enableDemo({ VITE_M08_TEMPORAL_SCENARIO: scenario });
    const error = await getParticipantTemporalLocation(COHORT, REF(4)).catch((reason) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
  });

  it('participante de otra cohorte o retirado: no se entrega', async () => {
    enableDemo();
    expect(await codeOf(getParticipantTemporalLocation(COHORT, REF(7)))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);

    await removeCohortParticipant(COHORT, 'demo-participante-3');
    expect(await codeOf(getParticipantTemporalLocation(COHORT, REF(3)))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);
  });

  it('RF-149 no cubre M04: no tiene escenarios de datos desactualizados', () => {
    expect(getTemporalDemoScenario({ VITE_M08_TEMPORAL_SCENARIO: 'desactualizado' })).toBe('cronograma');
  });

  it('datos ficticios inmutables, sin motivo de pausas ni datos personales', () => {
    expect(Object.isFrozen(DEMO_TEMPORAL_LOCATION)).toBe(true);
    expect(JSON.stringify(DEMO_TEMPORAL_LOCATION)).not.toMatch(/reason|motivo|@|uuid|Id"/i);
    for (const value of Object.values(DEMO_TEMPORAL_LOCATION)) {
      expect(Object.keys(value).sort()).toEqual(['currentUnitName', 'effectiveElapsedSeconds', 'pauses', 'programFinished']);
    }
  });
});

describe('Modo degradado simulado (RF-149) en M05, M06 y M07', () => {
  const SOURCES = Object.freeze([
    ['M05 ficha', 'VITE_M08_PROFILE_SCENARIO', () => getParticipantTrackingProfile(COHORT, REF(4))],
    ['M05 historial', 'VITE_M08_ALERT_HISTORY_SCENARIO', () => getParticipantAlertHistory(COHORT, REF(4))],
    ['M06', 'VITE_M08_NARRATIVE_SCENARIO', () => getParticipantNarrativeProgress(COHORT, REF(4))],
    ['M07', 'VITE_M08_NOTIFICATIONS_SCENARIO', () => getParticipantNotificationInteraction(COHORT, REF(4))],
  ]);

  it.each(SOURCES)('%s desactualizado: autorizado, con la marca y la fecha exacta del último dato', async (_, variable, query) => {
    enableDemo({ [variable]: 'desactualizado' });
    const response = await query();

    expect(response.access).toBe(TRACKING_ACCESS.GRANTED);
    expect(interpretFreshness(response)).toEqual({ state: FRESHNESS_STATE.STALE, lastAvailableAt: DEMO_LAST_AVAILABLE_AT });
  });

  it.each(SOURCES)('%s desactualizado sin fecha confiable', async (_, variable, query) => {
    enableDemo({ [variable]: 'desactualizado-sin-fecha' });

    expect(interpretFreshness(await query()).state).toBe(FRESHNESS_STATE.STALE_UNDATED);
  });

  it.each(SOURCES)('%s en funcionamiento normal: datos actuales, sin marca', async (_, _variable, query) => {
    enableDemo();

    expect(interpretFreshness(await query()).state).toBe(FRESHNESS_STATE.CURRENT);
  });

  it('dos fuentes caídas a la vez no afectan a las demás', async () => {
    enableDemo({ VITE_M08_NARRATIVE_SCENARIO: 'no-disponible', VITE_M08_NOTIFICATIONS_SCENARIO: 'desactualizado' });

    expect(await codeOf(getParticipantNarrativeProgress(COHORT, REF(4)))).toBe(TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE);
    expect(interpretFreshness(await getParticipantNotificationInteraction(COHORT, REF(4))).state).toBe(FRESHNESS_STATE.STALE);
    expect((await getParticipantTrackingProfile(COHORT, REF(4))).access).toBe(TRACKING_ACCESS.GRANTED);
    expect((await temporalOf(REF(4))).outcome).toBe(SECTION_OUTCOME.OK);
  });
});
