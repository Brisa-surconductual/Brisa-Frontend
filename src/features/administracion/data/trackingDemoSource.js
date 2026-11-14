import { TRACKING_ACCESS, TRACKING_QUERY_ERROR } from '../types/participantTracking.js';
import { TRACKING_DEMO_SCENARIO, getTrackingDemoScenario } from '../utils/trackingDemoScenario.js';
import { getDemoCohortMembers } from './cohortDemoSource.js';
import { DEMO_TRACKING_INDICATORS } from './trackingDemoData.js';
import { applyTrackingQuery } from './trackingDemoQuery.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE SEGUIMIENTO (solo desarrollo). Solo la carga
 * trackingSource.js mediante import() dinámico cuando el modo demo está
 * activo; en producción este módulo no llega al build.
 *
 * Simula al backend de RF-142: cruza las asociaciones actuales de la
 * cohorte (las mismas de E5–E7, en memoria) con indicadores ficticios
 * propios, aplica filtros, orden y paginación, y declara de forma
 * explícita si la consulta está autorizada. Las respuestas de
 * autorización son ficticias: no constituyen seguridad real.
 *
 * Los registros incluyen campos adicionales (identificador interno y
 * estado de elegibilidad) para comprobar que la interfaz los descarta.
 */
export const TRACKING_DEMO_DELAY_MS = 400;

const pause = () => new Promise((resolve) => setTimeout(resolve, TRACKING_DEMO_DELAY_MS));

function codedError(code, message) {
  return Object.assign(new Error(message), { code });
}

function rowsFor(cohortId, members) {
  return members.map((member) => ({
    cohortId,
    code: member.code,
    progress: DEMO_TRACKING_INDICATORS[member.id]?.progress ?? null,
    adherence: DEMO_TRACKING_INDICATORS[member.id]?.adherence ?? null,
    activeAlertCount: DEMO_TRACKING_INDICATORS[member.id]?.activeAlertCount ?? null,
    // Campos que la interfaz debe descartar.
    participantId: member.id,
    participationStatus: 'NO_ES_UN_INDICADOR',
  }));
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
