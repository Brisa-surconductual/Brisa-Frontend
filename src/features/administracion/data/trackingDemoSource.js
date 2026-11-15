import {
  ALERT_RESOLUTION_STATUS,
  TRACKING_ACCESS,
  TRACKING_ALERT_SOURCE,
  TRACKING_ALERT_TYPE,
  TRACKING_QUERY_ERROR,
} from '../types/participantTracking.js';
import { ALERT_HISTORY_DEMO_SCENARIO, getAlertHistoryDemoScenario } from '../utils/alertHistoryDemoScenario.js';
import { PROFILE_DEMO_SCENARIO, getProfileDemoScenario } from '../utils/profileDemoScenario.js';
import { TRACKING_DEMO_SCENARIO, getTrackingDemoScenario } from '../utils/trackingDemoScenario.js';
import { getDemoCohortMembers } from './cohortDemoSource.js';
import { DEMO_ALERT_HISTORY, DEMO_TRACKING_PROFILES, DEMO_TRACKING_REFERENCES } from './trackingDemoData.js';
import { applyTrackingQuery } from './trackingDemoQuery.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE SEGUIMIENTO (solo desarrollo). Solo la carga
 * trackingSource.js mediante import() dinámico cuando el modo demo está
 * activo; en producción este módulo no llega al build.
 *
 * Simula al backend de RF-142 (listado), RF-128 (ficha) y RF-129
 * (historial de alertas): cruza las
 * asociaciones actuales de la cohorte (las mismas de E5–E7, en memoria)
 * con un único conjunto de perfiles ficticios, aplica filtros, orden y
 * paginación, y declara de forma explícita si la consulta está
 * autorizada. Las respuestas de autorización son ficticias: no
 * constituyen seguridad real.
 *
 * Las respuestas incluyen campos adicionales (identificador interno,
 * estado de elegibilidad, datos personales ficticios) para comprobar
 * que la interfaz los descarta.
 */
export const TRACKING_DEMO_DELAY_MS = 400;

const pause = () => new Promise((resolve) => setTimeout(resolve, TRACKING_DEMO_DELAY_MS));

function codedError(code, message) {
  return Object.assign(new Error(message), { code });
}

// Valores del listado derivados del perfil: misma fuente que la ficha.
function rowsFor(cohortId, members) {
  return members.map((member) => {
    const profile = DEMO_TRACKING_PROFILES[member.id];

    return {
      cohortId,
      code: member.code,
      reference: DEMO_TRACKING_REFERENCES[member.id] ?? null,
      progress: profile?.progress ?? null,
      adherence: profile?.adherence ?? null,
      activeAlertCount: profile ? profile.activeAlerts.length : null,
      // Campos que la interfaz debe descartar.
      participantId: member.id,
      participationStatus: 'NO_ES_UN_INDICADOR',
    };
  });
}

export async function listCohortTracking(cohortId, query) {
  const scenario = getTrackingDemoScenario();

  if (scenario === TRACKING_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === TRACKING_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado al consultar el seguimiento de demostración.');
  }

  const members = getDemoCohortMembers(cohortId);

  if (!members) {
    throw codedError(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND, 'Cohorte inexistente en la demostración.');
  }

  const { total, items } = applyTrackingQuery(rowsFor(cohortId, members), query);
  const page = { cohortId, total, offset: query.offset, limit: query.limit, items };

  if (scenario === TRACKING_DEMO_SCENARIO.DENIED) {
    return { ...page, access: TRACKING_ACCESS.DENIED };
  }

  if (scenario === TRACKING_DEMO_SCENARIO.FOREIGN_RESPONSE) {
    return { ...page, access: TRACKING_ACCESS.GRANTED, cohortId: 'otra-cohorte-ficticia' };
  }

  if (scenario === TRACKING_DEMO_SCENARIO.FOREIGN_RECORD) {
    const foreign = { ...rowsFor('otra-cohorte-ficticia', [{ id: 'ajeno', code: 'AJENO-0000' }])[0], progress: 50, adherence: 50, activeAlertCount: 0 };
    return { ...page, access: TRACKING_ACCESS.GRANTED, items: [...items, foreign] };
  }

  return { ...page, access: TRACKING_ACCESS.GRANTED };
}

function participantFor(reference) {
  return Object.keys(DEMO_TRACKING_REFERENCES).find((id) => DEMO_TRACKING_REFERENCES[id] === reference) ?? null;
}

/*
 * Ficha individual (RF-128). Valida en este orden, como lo haría el
 * backend: cohorte existente, referencia existente, pertenencia actual a
 * la cohorte y, por último, existencia de perfil.
 */
export async function getParticipantTrackingProfile(cohortId, reference) {
  const scenario = getProfileDemoScenario();

  if (scenario === PROFILE_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === PROFILE_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado al cargar la ficha de demostración.');
  }

  if (scenario === PROFILE_DEMO_SCENARIO.UNAVAILABLE) {
    throw codedError(TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE, 'M05 no disponible en la demostración.');
  }

  const members = getDemoCohortMembers(cohortId);

  if (!members) {
    throw codedError(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND, 'Cohorte inexistente en la demostración.');
  }

  const participantId = participantFor(reference);

  if (!participantId || scenario === PROFILE_DEMO_SCENARIO.NOT_FOUND) {
    throw codedError(TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND, 'Referencia inexistente en la demostración.');
  }

  const member = members.find(({ id }) => id === participantId);

  if (!member || scenario === PROFILE_DEMO_SCENARIO.OUTSIDE_COHORT) {
    throw codedError(TRACKING_QUERY_ERROR.OUTSIDE_COHORT, 'El participante no pertenece a la cohorte en la demostración.');
  }

  const profile = scenario === PROFILE_DEMO_SCENARIO.NO_PROFILE ? null : DEMO_TRACKING_PROFILES[participantId] ?? null;
  const response = {
    access: TRACKING_ACCESS.GRANTED,
    cohortId,
    reference,
    code: member.code,
    profile: profile && {
      ...profile,
      // Campos que la interfaz debe descartar.
      cravingLevel: 5,
      diaryText: 'Texto ficticio que nunca debe mostrarse.',
    },
    // Campos que la interfaz debe descartar.
    participantId,
    email: 'participante.ficticio@example.com',
    participationStatus: 'NO_ES_UN_INDICADOR',
  };

  if (scenario === PROFILE_DEMO_SCENARIO.DENIED) return { ...response, access: TRACKING_ACCESS.DENIED };
  if (scenario === PROFILE_DEMO_SCENARIO.INCONSISTENT) return { ...response, reference: 'seg-otro000' };
  if (scenario === PROFILE_DEMO_SCENARIO.OTHER_COHORT) return { ...response, cohortId: 'otra-cohorte-ficticia' };

  return response;
}

// Alerta tal como la enviaría M05, con campos que la interfaz descarta.
function rawAlert(alert, reference, index) {
  return {
    ...alert,
    reference,
    alertId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    cravingLevel: 8,
    notes: 'Nota ficticia que nunca debe mostrarse.',
  };
}

/*
 * Historial de alertas (RF-129). Mismas validaciones y orden que la
 * ficha: cohorte existente, referencia existente y pertenencia actual.
 * Las alertas ACTIVA son las mismas que el perfil expone como activas.
 */
export async function getParticipantAlertHistory(cohortId, reference) {
  const scenario = getAlertHistoryDemoScenario();

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado al cargar el historial de alertas de demostración.');
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.UNAVAILABLE) {
    throw codedError(TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE, 'M05 no disponible en la demostración.');
  }

  const members = getDemoCohortMembers(cohortId);

  if (!members) {
    throw codedError(TRACKING_QUERY_ERROR.COHORT_NOT_FOUND, 'Cohorte inexistente en la demostración.');
  }

  const participantId = participantFor(reference);

  if (!participantId || scenario === ALERT_HISTORY_DEMO_SCENARIO.NOT_FOUND) {
    throw codedError(TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND, 'Referencia inexistente en la demostración.');
  }

  if (!members.some(({ id }) => id === participantId)) {
    throw codedError(TRACKING_QUERY_ERROR.OUTSIDE_COHORT, 'El participante no pertenece a la cohorte en la demostración.');
  }

  const stored = scenario === ALERT_HISTORY_DEMO_SCENARIO.EMPTY ? [] : DEMO_ALERT_HISTORY[participantId] ?? [];
  const alerts = stored.map((alert, index) => rawAlert(alert, reference, index));
  const response = {
    access: TRACKING_ACCESS.GRANTED,
    cohortId,
    reference,
    alerts,
    // Campos que la interfaz debe descartar.
    participantId,
    email: 'participante.ficticio@example.com',
  };

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.DENIED) {
    return { ...response, access: TRACKING_ACCESS.DENIED };
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.OTHER_COHORT) {
    return { ...response, cohortId: 'otra-cohorte-ficticia' };
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.OTHER_PARTICIPANT) {
    const foreign = rawAlert(
      { type: TRACKING_ALERT_TYPE.HIGH_CRAVING, source: TRACKING_ALERT_SOURCE.HIGH_CRAVING, generatedAt: '2026-03-04T20:00:00-05:00', status: ALERT_RESOLUTION_STATUS.ACTIVE, resolvedAt: null },
      'seg-otro000',
      alerts.length,
    );
    return { ...response, alerts: [...alerts, foreign] };
  }

  if (scenario === ALERT_HISTORY_DEMO_SCENARIO.OUT_OF_SYNC) {
    const extra = rawAlert(
      { type: TRACKING_ALERT_TYPE.INACTIVITY, source: TRACKING_ALERT_SOURCE.INACTIVITY, generatedAt: '2026-03-09T07:30:00-05:00', status: ALERT_RESOLUTION_STATUS.ACTIVE, resolvedAt: null },
      reference,
      alerts.length,
    );
    return { ...response, alerts: [...alerts, extra] };
  }

  return response;
}
