import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_TRACKING_QUERY } from '../services/trackingQuery.js';
import { interpretProfileResponse } from '../services/trackingProfileResponse.js';
import { interpretTrackingResponse } from '../services/trackingResponse.js';
import { INDICATOR_STATE, PROFILE_OUTCOME, TRACKING_ACCESS, TRACKING_QUERY_ERROR } from '../types/participantTracking.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { removeCohortParticipant } from './participantSource.js';
import { DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';
import { getParticipantTrackingProfile, listCohortTracking } from './trackingSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_PROFILE_SCENARIO', scenario);
}

const COHORT = 'demo-cohorte-b';
const REF_1 = DEMO_TRACKING_REFERENCES['demo-participante-1'];
const REF_3 = DEMO_TRACKING_REFERENCES['demo-participante-3'];
const REF_4 = DEMO_TRACKING_REFERENCES['demo-participante-4'];
const REF_5 = DEMO_TRACKING_REFERENCES['demo-participante-5'];
const REF_7 = DEMO_TRACKING_REFERENCES['demo-participante-7'];

const codeOf = async (promise) => (await promise.catch((error) => error)).code;
const interpreted = async (cohortId, reference) =>
  interpretProfileResponse(await getParticipantTrackingProfile(cohortId, reference), { cohortId, reference });

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // La ficha no hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Ficha sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: rechaza sin datos ficticios', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    await expect(getParticipantTrackingProfile(COHORT, REF_1)).rejects.toThrow('no está integrada');
  });
});

describe('Ficha en modo de demostración', () => {
  it('referencia opaca válida: perfil autorizado de la cohorte y referencia pedidas', async () => {
    enableDemo();
    const response = await getParticipantTrackingProfile(COHORT, REF_4);

    expect(response).toMatchObject({ access: TRACKING_ACCESS.GRANTED, cohortId: COHORT, reference: REF_4, code: 'PART-0004' });
    const result = interpretProfileResponse(response, { cohortId: COHORT, reference: REF_4 });
    expect(result.outcome).toBe(PROFILE_OUTCOME.OK);
    expect(result.profile.trend).toBe('NO_CALCULADA');
    expect(result.profile.activeAlerts.map(({ type }) => type)).toEqual(['CRAVING_ELEVADO', 'INACTIVIDAD']);
  });

  it('la respuesta trae campos adicionales que la interpretación descarta', async () => {
    enableDemo();
    const response = await getParticipantTrackingProfile(COHORT, REF_1);
    const result = interpretProfileResponse(response, { cohortId: COHORT, reference: REF_1 });

    expect(response).toHaveProperty('email');
    expect(response.profile).toHaveProperty('diaryText');
    expect(JSON.stringify(result)).not.toMatch(/@|demo-participante|diaryText|cravingLevel|NO_ES_UN_INDICADOR/);
  });

  it('participante asociado sin perfil (204)', async () => {
    enableDemo();

    expect(await interpreted(COHORT, REF_5)).toEqual({ outcome: PROFILE_OUTCOME.NO_PROFILE, code: 'PART-0005', profile: null });
  });

  it('referencia inexistente (404)', async () => {
    enableDemo();

    expect(await codeOf(getParticipantTrackingProfile(COHORT, 'seg-zzzzzz'))).toBe(TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND);
    expect(await codeOf(getParticipantTrackingProfile(COHORT, 'demo-participante-1'))).toBe(TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND);
  });

  it('cohorte inexistente', async () => {
    enableDemo();

    expect(await codeOf(getParticipantTrackingProfile('no-existe', REF_1))).toBe(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND);
  });

  it('participante de otra cohorte: no se muestra en esta', async () => {
    enableDemo();

    expect(await codeOf(getParticipantTrackingProfile(COHORT, REF_7))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);
  });

  it('participante retirado: su antigua referencia ya no da acceso en esta cohorte', async () => {
    enableDemo();
    expect((await interpreted(COHORT, REF_3)).outcome).toBe(PROFILE_OUTCOME.OK);

    await removeCohortParticipant(COHORT, 'demo-participante-3');

    expect(await codeOf(getParticipantTrackingProfile(COHORT, REF_3))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);
  });
});

describe('Coherencia entre listado (RF-142) y ficha (RF-128)', () => {
  it('cada participante del listado tiene en su ficha los mismos indicadores y número de alertas', async () => {
    enableDemo();
    const list = interpretTrackingResponse(await listCohortTracking(COHORT, { ...INITIAL_TRACKING_QUERY, limit: 50 }), COHORT);

    expect(list.entries).toHaveLength(6);
    for (const entry of list.entries) {
      const result = await interpreted(COHORT, entry.reference);

      if (result.outcome === PROFILE_OUTCOME.NO_PROFILE) {
        expect(entry).toMatchObject({ progress: null, adherence: null, activeAlertCount: null });
        continue;
      }

      const valueOf = ({ state, value }) => (state === INDICATOR_STATE.AVAILABLE ? value : null);
      expect(result.code).toBe(entry.code);
      expect(valueOf(result.profile.progress)).toBe(entry.progress);
      expect(valueOf(result.profile.adherence)).toBe(entry.adherence);
      expect(result.profile.activeAlerts).toHaveLength(entry.activeAlertCount);
    }
  });
});

describe('Escenarios de la ficha (VITE_M08_PROFILE_SCENARIO)', () => {
  it('denegado: DENEGADO aunque la respuesta traiga datos', async () => {
    enableDemo('denegado');
    const response = await getParticipantTrackingProfile(COHORT, REF_1);

    expect(response.access).toBe(TRACKING_ACCESS.DENIED);
    expect(response.profile).not.toBeNull();
    expect(interpretProfileResponse(response, { cohortId: COHORT, reference: REF_1 })).toEqual({ outcome: PROFILE_OUTCOME.DENIED });
  });

  it.each([
    ['sin-perfil', PROFILE_OUTCOME.NO_PROFILE],
    ['inconsistente', PROFILE_OUTCOME.INCONSISTENT],
    ['otra-cohorte', PROFILE_OUTCOME.INCONSISTENT],
  ])('%s', async (scenario, outcome) => {
    enableDemo(scenario);

    expect((await interpreted(COHORT, REF_1)).outcome).toBe(outcome);
  });

  it.each([
    ['inexistente', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['fuera-de-cohorte', TRACKING_QUERY_ERROR.OUTSIDE_COHORT],
    ['no-disponible', TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE],
    ['error', undefined],
  ])('%s: rechaza con su código', async (scenario, code) => {
    enableDemo(scenario);
    const error = await getParticipantTrackingProfile(COHORT, REF_1).catch((reason) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
  });

  it('carga: la consulta no termina', async () => {
    enableDemo('carga');
    const outcome = await Promise.race([
      getParticipantTrackingProfile(COHORT, REF_1).then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });

  it('los escenarios del listado no afectan la ficha, ni los de la ficha al listado', async () => {
    enableDemo('no-disponible');
    vi.stubEnv('VITE_M08_TRACKING_SCENARIO', 'error');

    expect(await codeOf(getParticipantTrackingProfile(COHORT, REF_1))).toBe(TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE);
    vi.stubEnv('VITE_M08_TRACKING_SCENARIO', 'lista');
    expect((await listCohortTracking(COHORT, INITIAL_TRACKING_QUERY)).total).toBe(6);
  });
});
