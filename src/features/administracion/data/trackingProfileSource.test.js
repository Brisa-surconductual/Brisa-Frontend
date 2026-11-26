import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PROFILE_STATUS, TRACKING_CLIENT_ERROR, classifyProfileError } from '../services/trackingErrors.js';
import { INITIAL_TRACKING_QUERY } from '../services/trackingQuery.js';
import { interpretProfileResponse } from '../services/trackingProfileResponse.js';
import { interpretTrackingResponse } from '../services/trackingResponse.js';
import { PROFILE_OUTCOME } from '../types/participantTracking.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { removeCohortParticipant } from './participantSource.js';
import { getParticipantTrackingProfile, listCohortTracking } from './trackingSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (scenario) vi.stubEnv('VITE_M08_PROFILE_SCENARIO', scenario);
}

const COHORT = 'demo-cohorte-b';

const statusOf = async (promise) => classifyProfileError(await promise.catch((error) => error));
const interpreted = async (cohortId, code) =>
  interpretProfileResponse(await getParticipantTrackingProfile(cohortId, code), { code });

let fetchSpy;

beforeEach(() => {
  resetDemoSource();
  resetDemoScenarios(vi);
  fetchSpy = vi.fn(() => Promise.reject(new Error('Sin red en las pruebas')));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  // La demostración no hace peticiones HTTP.
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Ficha en la demostración: forma del contrato real', () => {
  it('perfil del participante pedido, con modo de solo lectura', async () => {
    enableDemo();
    const result = await interpreted(COHORT, 'PART-0001');

    expect(result).toMatchObject({ outcome: PROFILE_OUTCOME.OK, code: 'PART-0001' });
    expect(result.profile).toMatchObject({ progressLevel: 'COMPLETADO', adherence: 0.91, trend: 'REDUCCION' });
  });

  it('la respuesta trae campos adicionales que la interpretación descarta', async () => {
    enableDemo();
    const response = await getParticipantTrackingProfile(COHORT, 'PART-0004');

    expect(JSON.stringify(response)).toMatch(/correo|texto_diario|nivel_craving|id_usuario/);
    expect(JSON.stringify(interpretProfileResponse(response, { code: 'PART-0004' }))).not.toMatch(/@|Texto ficticio|craving|demo-participante/);
  });

  it('participante asociado sin perfil (204)', async () => {
    enableDemo();

    expect(await getParticipantTrackingProfile(COHORT, 'PART-0005')).toBeNull();
  });

  it('cohorte inexistente: 404 COHORTE_NO_ENCONTRADA', async () => {
    enableDemo();

    expect(await statusOf(getParticipantTrackingProfile('cohorte-inexistente', 'PART-0001'))).toBe(PROFILE_STATUS.COHORT_NOT_FOUND);
  });

  it.each([
    ['código de otra cohorte', 'PART-0007'],
    ['código inexistente', 'PART-9999'],
    ['referencia ficticia antigua', 'seg-k7m2q9'],
  ])('%s: fuera de la cohorte, sin perfil', async (_, code) => {
    enableDemo();

    await expect(getParticipantTrackingProfile(COHORT, code)).rejects.toMatchObject({ codigo: TRACKING_CLIENT_ERROR.OUTSIDE_COHORT });
  });

  it('participante retirado: su código ya no abre la ficha en esta cohorte', async () => {
    enableDemo();
    expect((await interpreted(COHORT, 'PART-0003')).outcome).toBe(PROFILE_OUTCOME.OK);

    await removeCohortParticipant(COHORT, 'demo-participante-3');

    expect(await statusOf(getParticipantTrackingProfile(COHORT, 'PART-0003'))).toBe(PROFILE_STATUS.OUTSIDE_COHORT);
  });
});

describe('Coherencia entre listado (RF-142) y ficha (RF-128) en la demostración', () => {
  it('cada participante del listado tiene en su ficha el mismo nivel, adherencia y número de alertas', async () => {
    enableDemo();
    const list = interpretTrackingResponse(await listCohortTracking(COHORT, { ...INITIAL_TRACKING_QUERY, limit: 50 }));

    expect(list.entries).toHaveLength(22);
    for (const entry of list.entries) {
      const result = await interpreted(COHORT, entry.code);

      if (result.outcome === PROFILE_OUTCOME.NO_PROFILE) {
        expect(entry).toMatchObject({ progressLevel: null, adherence: null, activeAlertCount: 0 });
        continue;
      }

      expect(result.code).toBe(entry.code);
      expect(result.profile.progressLevel).toBe(entry.progressLevel);
      expect(result.profile.adherence).toBe(entry.adherence);
      expect(result.profile.activeAlerts).toHaveLength(entry.activeAlertCount);
    }
    // Recorre las 22 fichas de la Cohorte Piloto B (400 ms simulados cada una).
  }, 20_000);
});

describe('Escenarios de la ficha (VITE_M08_PROFILE_SCENARIO)', () => {
  it.each([
    ['denegado', PROFILE_STATUS.DENIED],
    ['inexistente', PROFILE_STATUS.NOT_FOUND],
    ['fuera-de-cohorte', PROFILE_STATUS.OUTSIDE_COHORT],
    ['otra-cohorte', PROFILE_STATUS.OUTSIDE_COHORT],
    ['no-disponible', PROFILE_STATUS.UNAVAILABLE],
    ['error', PROFILE_STATUS.ERROR],
  ])('%s: rechaza sin datos (%s)', async (scenario, status) => {
    enableDemo(scenario);

    expect(await statusOf(getParticipantTrackingProfile(COHORT, 'PART-0001'))).toBe(status);
  });

  it.each([
    ['sin-perfil', PROFILE_OUTCOME.NO_PROFILE],
    ['inconsistente', PROFILE_OUTCOME.INCONSISTENT],
  ])('%s', async (scenario, outcome) => {
    enableDemo(scenario);

    expect((await interpreted(COHORT, 'PART-0001')).outcome).toBe(outcome);
  });

  it('carga: la consulta no termina', async () => {
    enableDemo('carga');
    const outcome = await Promise.race([
      getParticipantTrackingProfile(COHORT, 'PART-0001').then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });

  it('los escenarios del listado no afectan la ficha, ni los de la ficha al listado', async () => {
    enableDemo('no-disponible');
    vi.stubEnv('VITE_M08_TRACKING_SCENARIO', 'error');

    expect(await statusOf(getParticipantTrackingProfile(COHORT, 'PART-0001'))).toBe(PROFILE_STATUS.UNAVAILABLE);
    vi.stubEnv('VITE_M08_TRACKING_SCENARIO', 'lista');
    expect((await listCohortTracking(COHORT, INITIAL_TRACKING_QUERY)).total).toBe(22);
  });
});
