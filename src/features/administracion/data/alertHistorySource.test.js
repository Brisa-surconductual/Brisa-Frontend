import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hasActiveSummaryMismatch } from '../services/alertHistory.js';
import { interpretAlertHistoryResponse } from '../services/alertHistoryResponse.js';
import { interpretProfileResponse } from '../services/trackingProfileResponse.js';
import { INITIAL_TRACKING_QUERY } from '../services/trackingQuery.js';
import { interpretTrackingResponse } from '../services/trackingResponse.js';
import {
  ALERT_HISTORY_OUTCOME,
  ALERT_RESOLUTION_STATUS,
  PROFILE_OUTCOME,
  TRACKING_ACCESS,
  TRACKING_QUERY_ERROR,
} from '../types/participantTracking.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { removeCohortParticipant } from './participantSource.js';
import { DEMO_ALERT_HISTORY, DEMO_TRACKING_PROFILES, DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';
import { getParticipantAlertHistory, getParticipantTrackingProfile, listCohortTracking } from './trackingSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_ALERT_HISTORY_SCENARIO', scenario);
}

const COHORT = 'demo-cohorte-b';
const REF_1 = DEMO_TRACKING_REFERENCES['demo-participante-1'];
const REF_3 = DEMO_TRACKING_REFERENCES['demo-participante-3'];
const REF_4 = DEMO_TRACKING_REFERENCES['demo-participante-4'];
const REF_7 = DEMO_TRACKING_REFERENCES['demo-participante-7'];

const codeOf = async (promise) => (await promise.catch((error) => error)).code;
const history = async (cohortId, reference) =>
  interpretAlertHistoryResponse(await getParticipantAlertHistory(cohortId, reference), { cohortId, reference });

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  resetDemoScenarios(vi);
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // El historial no hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Historial sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: rechaza sin datos ficticios', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    await expect(getParticipantAlertHistory(COHORT, REF_4)).rejects.toThrow('no está integrada');
  });
});

describe('Historial en modo de demostración', () => {
  it('autorizado, de la cohorte y referencia pedidas, con cada alerta declarando el participante', async () => {
    enableDemo();
    const response = await getParticipantAlertHistory(COHORT, REF_4);

    expect(response).toMatchObject({ access: TRACKING_ACCESS.GRANTED, cohortId: COHORT, reference: REF_4 });
    expect(response.alerts).toHaveLength(6);
    for (const alert of response.alerts) expect(alert.reference).toBe(REF_4);
  });

  it('trae campos adicionales (UUID, notas, nivel de craving, correo) que la interpretación descarta', async () => {
    enableDemo();
    const raw = await getParticipantAlertHistory(COHORT, REF_4);
    const result = interpretAlertHistoryResponse(raw, { cohortId: COHORT, reference: REF_4 });

    expect(JSON.stringify(raw)).toMatch(/alertId|cravingLevel|notes|@example\.com/);
    expect(result.outcome).toBe(ALERT_HISTORY_OUTCOME.OK);
    expect(JSON.stringify(result)).not.toMatch(/alertId|00000000-|cravingLevel|Nota ficticia|@|demo-participante/);
  });

  it('PART-0004: los cuatro estados, en orden cronológico de generación', async () => {
    enableDemo();
    const result = await history(COHORT, REF_4);

    expect(result.alerts.map(({ generatedAt }) => generatedAt.slice(0, 10))).toEqual([
      '2026-02-10', '2026-02-18', '2026-02-24', '2026-03-03', '2026-03-05', '2026-03-07',
    ]);
    const { ACTIVE, IN_REVIEW, RESOLVED, DISMISSED } = ALERT_RESOLUTION_STATUS;
    expect(new Set(result.alerts.map(({ status }) => status))).toEqual(new Set([ACTIVE, IN_REVIEW, RESOLVED, DISMISSED]));
    expect(result.alerts[0]).toMatchObject({ status: ALERT_RESOLUTION_STATUS.RESOLVED, resolvedAt: null });
  });

  it('participante sin alertas registradas (204)', async () => {
    enableDemo();

    expect(await history(COHORT, REF_1)).toMatchObject({ outcome: ALERT_HISTORY_OUTCOME.EMPTY, alerts: [] });
  });

  it.each([
    ['referencia inexistente (404)', COHORT, 'seg-zzzzzz', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['cohorte inexistente', 'cohorte-inexistente', REF_4, TRACKING_QUERY_ERROR.COHORT_NOT_FOUND],
    ['participante de otra cohorte', COHORT, REF_7, TRACKING_QUERY_ERROR.OUTSIDE_COHORT],
  ])('%s', async (_, cohortId, reference, code) => {
    enableDemo();

    expect(await codeOf(getParticipantAlertHistory(cohortId, reference))).toBe(code);
  });

  it('participante retirado: su historial ya no se entrega en esta cohorte', async () => {
    enableDemo();
    expect((await history(COHORT, REF_3)).outcome).toBe(ALERT_HISTORY_OUTCOME.OK);

    await removeCohortParticipant(COHORT, 'demo-participante-3');

    expect(await codeOf(getParticipantAlertHistory(COHORT, REF_3))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);
  });
});

describe('Coherencia entre alertas activas (RF-128), listado (RF-142) e historial (RF-129)', () => {
  it.each(['demo-cohorte-b', 'demo-cohorte-c'])('%s: las ACTIVA del historial son las del resumen y del listado', async (cohortId) => {
    enableDemo();
    const list = interpretTrackingResponse(await listCohortTracking(cohortId, { ...INITIAL_TRACKING_QUERY, limit: 50 }));

    for (const entry of list.entries) {
      // La ficha se abre por código; el historial de la demo lo acepta también.
      const profile = interpretProfileResponse(await getParticipantTrackingProfile(cohortId, entry.code), { code: entry.code });
      const result = await history(cohortId, entry.code);
      const alerts = result.alerts;
      const active = alerts.filter(({ status }) => status === ALERT_RESOLUTION_STATUS.ACTIVE);

      if (profile.outcome === PROFILE_OUTCOME.OK) {
        expect(hasActiveSummaryMismatch(profile.profile.activeAlerts, alerts)).toBe(false);
        expect(entry.activeAlertCount).toBe(active.length);
      } else {
        expect(active).toHaveLength(0);
      }
    }
  }, 20000);

  it('las resueltas, descartadas o en revisión nunca cuentan como activas', () => {
    for (const [id, profile] of Object.entries(DEMO_TRACKING_PROFILES)) {
      const active = DEMO_ALERT_HISTORY[id].filter(({ status }) => status === ALERT_RESOLUTION_STATUS.ACTIVE);
      expect(profile.activeAlerts).toHaveLength(active.length);
    }
  });
});

describe('Escenarios del historial (VITE_M08_ALERT_HISTORY_SCENARIO)', () => {
  it('denegado: DENEGADO aunque la respuesta traiga alertas', async () => {
    enableDemo('denegado');
    const response = await getParticipantAlertHistory(COHORT, REF_4);

    expect(response.access).toBe(TRACKING_ACCESS.DENIED);
    expect(response.alerts.length).toBeGreaterThan(0);
    expect(interpretAlertHistoryResponse(response, { cohortId: COHORT, reference: REF_4 })).toEqual({ outcome: ALERT_HISTORY_OUTCOME.DENIED });
  });

  it.each([
    ['vacio', ALERT_HISTORY_OUTCOME.EMPTY],
    ['otro-participante', ALERT_HISTORY_OUTCOME.INCONSISTENT],
    ['otra-cohorte', ALERT_HISTORY_OUTCOME.INCONSISTENT],
    ['desfase', ALERT_HISTORY_OUTCOME.OK],
  ])('%s', async (scenario, outcome) => {
    enableDemo(scenario);

    expect((await history(COHORT, REF_4)).outcome).toBe(outcome);
  });

  it('desfase: el historial trae una alerta activa que el resumen no tiene', async () => {
    enableDemo('desfase');
    const result = await history(COHORT, REF_4);

    expect(hasActiveSummaryMismatch(DEMO_TRACKING_PROFILES['demo-participante-4'].activeAlerts, result.alerts)).toBe(true);
  });

  it.each([
    ['inexistente', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['no-disponible', TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE],
    ['error', undefined],
  ])('%s: rechaza con su código', async (scenario, code) => {
    enableDemo(scenario);
    const error = await getParticipantAlertHistory(COHORT, REF_4).catch((reason) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
  });

  it('carga: la consulta no termina', async () => {
    enableDemo('carga');
    const outcome = await Promise.race([
      getParticipantAlertHistory(COHORT, REF_4).then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });

  it('los escenarios del historial no afectan la ficha, ni los de la ficha al historial', async () => {
    enableDemo('error');
    vi.stubEnv('VITE_M08_PROFILE_SCENARIO', 'perfil');

    expect((await getParticipantTrackingProfile(COHORT, 'PART-0004')).modo_consulta).toBe('SOLO_LECTURA');

    vi.stubEnv('VITE_M08_ALERT_HISTORY_SCENARIO', 'historial');
    vi.stubEnv('VITE_M08_PROFILE_SCENARIO', 'no-disponible');
    expect((await history(COHORT, REF_4)).outcome).toBe(ALERT_HISTORY_OUTCOME.OK);
  });
});
