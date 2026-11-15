import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { interpretNarrativeProgressResponse } from '../services/narrativeProgressResponse.js';
import { interpretNotificationInteractionResponse } from '../services/notificationInteractionResponse.js';
import { SECTION_OUTCOME } from '../types/participantEngagement.js';
import { INDICATOR_STATE, TRACKING_ACCESS, TRACKING_QUERY_ERROR } from '../types/participantTracking.js';
import { resetDemoSource } from './cohortDemoSource.js';
import { getParticipantNarrativeProgress, getParticipantNotificationInteraction } from './engagementSource.js';
import { removeCohortParticipant } from './participantSource.js';
import { DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';
import { getParticipantAlertHistory, getParticipantTrackingProfile } from './trackingSource.js';

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo({ narrative, notifications } = {}) {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  if (narrative) vi.stubEnv('VITE_M08_NARRATIVE_SCENARIO', narrative);
  if (notifications) vi.stubEnv('VITE_M08_NOTIFICATIONS_SCENARIO', notifications);
}

const COHORT = 'demo-cohorte-b';
const REF = (n) => DEMO_TRACKING_REFERENCES[`demo-participante-${n}`];
const codeOf = async (promise) => (await promise.catch((error) => error)).code;

const narrativeOf = async (reference, cohortId = COHORT) =>
  interpretNarrativeProgressResponse(await getParticipantNarrativeProgress(cohortId, reference), { cohortId, reference });
const notificationsOf = async (reference, cohortId = COHORT) =>
  interpretNotificationInteractionResponse(await getParticipantNotificationInteraction(cohortId, reference), { cohortId, reference });

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

describe('Sin integración', () => {
  it.each([
    ['sin la variable', true, ''],
    ['en producción, aunque exista la variable', false, 'true'],
  ])('%s: ambas consultas rechazan sin datos ficticios', async (_, dev, flag) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_M08_DEMO', flag);

    await expect(getParticipantNarrativeProgress(COHORT, REF(4))).rejects.toThrow('no está integrada');
    await expect(getParticipantNotificationInteraction(COHORT, REF(4))).rejects.toThrow('no está integrada');
  });
});

describe('Progresión narrativa de demostración (RF-130)', () => {
  it('autorizada para la cohorte y referencia pedidas; la interpretación descarta UUID, nivel y estado', async () => {
    enableDemo();
    const raw = await getParticipantNarrativeProgress(COHORT, REF(4));
    const result = interpretNarrativeProgressResponse(raw, { cohortId: COHORT, reference: REF(4) });

    expect(raw).toMatchObject({ access: TRACKING_ACCESS.GRANTED, cohortId: COHORT, reference: REF(4) });
    expect(JSON.stringify(raw)).toMatch(/gamificationLevel|00000000-|logro-uuid|@example\.com/);
    expect(result.outcome).toBe(SECTION_OUTCOME.OK);
    expect(result.data.activePhaseName).toMatch(/ficticia/);
    expect(result.data.achievements).toHaveLength(2);
    expect(JSON.stringify(result)).not.toMatch(/gamificationLevel|00000000-|uuid|Regla|@|demo-participante/);
  });

  it('casos de los datos: logros vacíos, sin capítulo, logros no disponibles y sin progresión (204)', async () => {
    enableDemo();

    expect((await narrativeOf(REF(2))).data.achievements).toEqual([]);
    expect((await narrativeOf(REF(3))).data.lastCompletedChapterName).toBeNull();
    expect((await narrativeOf(REF(6))).data.achievements).toBeNull();
    expect((await narrativeOf(REF(5))).outcome).toBe(SECTION_OUTCOME.EMPTY);
  });

  it.each([
    ['sin-datos', SECTION_OUTCOME.EMPTY],
    ['denegado', SECTION_OUTCOME.DENIED],
    ['otro-participante', SECTION_OUTCOME.INCONSISTENT],
    ['otra-cohorte', SECTION_OUTCOME.INCONSISTENT],
  ])('escenario %s', async (narrative, outcome) => {
    enableDemo({ narrative });

    expect((await narrativeOf(REF(4))).outcome).toBe(outcome);
  });

  it('escenario sin-logros: progresión con la lista de logros vacía', async () => {
    enableDemo({ narrative: 'sin-logros' });

    expect((await narrativeOf(REF(4))).data).toMatchObject({ achievements: [], activePhaseName: expect.any(String) });
  });

  it('denegado: la respuesta trae datos, pero se declara DENEGADO', async () => {
    enableDemo({ narrative: 'denegado' });
    const raw = await getParticipantNarrativeProgress(COHORT, REF(4));

    expect(raw.access).toBe(TRACKING_ACCESS.DENIED);
    expect(raw.narrative).not.toBeNull();
  });

  it.each([
    ['sin-permiso-explicito', TRACKING_QUERY_ERROR.EXPLICIT_PERMISSION_REQUIRED],
    ['inexistente', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['no-disponible', TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE],
    ['error', undefined],
  ])('escenario %s: rechaza con su código', async (narrative, code) => {
    enableDemo({ narrative });
    const error = await getParticipantNarrativeProgress(COHORT, REF(4)).catch((reason) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
  });
});

describe('Interacción con notificaciones de demostración (RF-131)', () => {
  it('autorizada; la interpretación descarta mensajes, eventos e identificadores', async () => {
    enableDemo();
    const raw = await getParticipantNotificationInteraction(COHORT, REF(4));
    const result = interpretNotificationInteractionResponse(raw, { cohortId: COHORT, reference: REF(4) });

    expect(JSON.stringify(raw)).toMatch(/Mensaje ficticio|EVENTO_CLINICO|00000000-/);
    expect(result.outcome).toBe(SECTION_OUTCOME.OK);
    expect(result.data.counts.sent).toEqual({ state: INDICATOR_STATE.AVAILABLE, value: 35 });
    expect(result.data.rates.conversionRate.state).toBe(INDICATOR_STATE.NOT_CALCULABLE);
    expect(JSON.stringify(result)).not.toMatch(/Mensaje|EVENTO|00000000-|@|demo-participante/);
  });

  it('casos de los datos: ceros reales, parciales, inválidos y sin historial (204)', async () => {
    enableDemo();

    expect((await notificationsOf(REF(2))).data.counts.opened).toEqual({ state: INDICATOR_STATE.AVAILABLE, value: 0 });
    expect((await notificationsOf(REF(3))).data).toMatchObject({ hasNotCalculable: true });
    expect((await notificationsOf(REF(3))).data.counts.sessionsFromNotification.state).toBe(INDICATOR_STATE.NOT_AVAILABLE);
    expect((await notificationsOf(REF(5))).outcome).toBe(SECTION_OUTCOME.EMPTY);
  });

  it('participante de Piloto C con valores inválidos: no disponibles, nunca corregidos', async () => {
    enableDemo();
    const { data } = await notificationsOf(DEMO_TRACKING_REFERENCES['demo-participante-8'], 'demo-cohorte-c');

    for (const field of ['sent', 'delivered', 'opened']) expect(data.counts[field].state).toBe(INDICATOR_STATE.NOT_AVAILABLE);
    expect(data.rates.openRate.state).toBe(INDICATOR_STATE.NOT_AVAILABLE);
  });

  it('escenario no-calculable: todas las métricas NO_CALCULABLE, ninguna en cero', async () => {
    enableDemo({ notifications: 'no-calculable' });
    const { data } = await notificationsOf(REF(4));

    for (const metric of [...Object.values(data.counts), ...Object.values(data.rates)]) {
      expect(metric).toEqual({ state: INDICATOR_STATE.NOT_CALCULABLE, value: null });
    }
  });

  it.each([
    ['sin-datos', SECTION_OUTCOME.EMPTY],
    ['denegado', SECTION_OUTCOME.DENIED],
    ['otro-participante', SECTION_OUTCOME.INCONSISTENT],
    ['otra-cohorte', SECTION_OUTCOME.INCONSISTENT],
  ])('escenario %s', async (notifications, outcome) => {
    enableDemo({ notifications });

    expect((await notificationsOf(REF(4))).outcome).toBe(outcome);
  });

  it.each([
    ['inexistente', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['no-disponible', TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE],
    ['error', undefined],
  ])('escenario %s: rechaza con su código', async (notifications, code) => {
    enableDemo({ notifications });
    const error = await getParticipantNotificationInteraction(COHORT, REF(4)).catch((reason) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
  });

  it('carga: la consulta no termina', async () => {
    enableDemo({ notifications: 'carga', narrative: 'carga' });
    const outcome = await Promise.race([
      Promise.any([getParticipantNotificationInteraction(COHORT, REF(4)), getParticipantNarrativeProgress(COHORT, REF(4))]).then(() => 'resuelta'),
      new Promise((resolve) => setTimeout(() => resolve('pendiente'), 600)),
    ]);

    expect(outcome).toBe('pendiente');
  });
});

describe('Aislamiento y autorización independientes', () => {
  it.each([
    ['referencia inexistente', COHORT, 'seg-zzzzzz', TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND],
    ['cohorte inexistente', 'cohorte-inexistente', REF(4), TRACKING_QUERY_ERROR.COHORT_NOT_FOUND],
    ['participante de otra cohorte', COHORT, REF(7), TRACKING_QUERY_ERROR.OUTSIDE_COHORT],
  ])('%s: ambas consultas lo rechazan', async (_, cohortId, reference, code) => {
    enableDemo();

    expect(await codeOf(getParticipantNarrativeProgress(cohortId, reference))).toBe(code);
    expect(await codeOf(getParticipantNotificationInteraction(cohortId, reference))).toBe(code);
  });

  it('participante retirado: su antigua referencia ya no da acceso a M06 ni M07 en esta cohorte', async () => {
    enableDemo();
    expect((await narrativeOf(REF(3))).outcome).toBe(SECTION_OUTCOME.OK);

    await removeCohortParticipant(COHORT, 'demo-participante-3');

    expect(await codeOf(getParticipantNarrativeProgress(COHORT, REF(3)))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);
    expect(await codeOf(getParticipantNotificationInteraction(COHORT, REF(3)))).toBe(TRACKING_QUERY_ERROR.OUTSIDE_COHORT);
  });

  it('M06 denegado no afecta a M07, ni M07 a M06, ni ninguno a la ficha o al historial', async () => {
    enableDemo({ narrative: 'denegado', notifications: 'error' });

    expect((await narrativeOf(REF(4))).outcome).toBe(SECTION_OUTCOME.DENIED);
    await expect(getParticipantNotificationInteraction(COHORT, REF(4))).rejects.toThrow();
    expect((await getParticipantTrackingProfile(COHORT, REF(4))).access).toBe(TRACKING_ACCESS.GRANTED);
    expect((await getParticipantAlertHistory(COHORT, REF(4))).access).toBe(TRACKING_ACCESS.GRANTED);

    vi.stubEnv('VITE_M08_NARRATIVE_SCENARIO', 'narrativa');
    vi.stubEnv('VITE_M08_NOTIFICATIONS_SCENARIO', 'denegado');
    expect((await narrativeOf(REF(4))).outcome).toBe(SECTION_OUTCOME.OK);
    expect((await notificationsOf(REF(4))).outcome).toBe(SECTION_OUTCOME.DENIED);
  });

  it('los escenarios de la ficha y del historial no afectan a M06 ni M07', async () => {
    enableDemo();
    vi.stubEnv('VITE_M08_PROFILE_SCENARIO', 'denegado');
    vi.stubEnv('VITE_M08_ALERT_HISTORY_SCENARIO', 'error');

    expect((await narrativeOf(REF(4))).outcome).toBe(SECTION_OUTCOME.OK);
    expect((await notificationsOf(REF(4))).outcome).toBe(SECTION_OUTCOME.OK);
  });
});
