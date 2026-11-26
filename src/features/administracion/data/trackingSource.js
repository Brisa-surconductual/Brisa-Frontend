import { listCohortParticipants } from '../api/participantesCohorteApi.js';
import {
  fetchCohortParticipantIndicators,
  fetchParticipantTrackingProfile,
} from '../api/seguimientoParticipantesApi.js';
import { normalizeParticipantCode } from '../services/chatTraceabilityIds.js';
import { TRACKING_CLIENT_ERROR, trackingError } from '../services/trackingErrors.js';
import { toTrackingParams } from '../services/trackingQuery.js';
import { PARTICIPATION_STATUS } from '../types/participantStatus.js';
import { TRACKING_SOURCE_MODE } from '../types/participantTracking.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente del seguimiento de participantes: listado por cohorte (RF-142)
 * y ficha individual (RF-128).
 *
 * - API (sin demostración): endpoints reales del backend
 *   (api/seguimientoParticipantesApi.js).
 * - DEMO (`VITE_M08_DEMO=true`, solo desarrollo): fuente ficticia que
 *   responde con las mismas formas del contrato real. Sus datos nunca se
 *   mezclan con los del backend: el modo se fija al montar la página.
 *
 * El historial de alertas (RF-129) sigue solo en la demostración: no se
 * integra en esta etapa.
 */
const NOT_INTEGRATED = 'La consulta del historial de alertas aún no está integrada.';

/*
 * Único punto que carga la demostración de seguimiento. El import
 * dinámico está dentro de la condición del M08: en producción la rama
 * se elimina y ningún indicador ni escenario ficticio llega al build.
 */
async function loadTrackingDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./trackingDemoSource.js');
}

export function getTrackingSourceMode(enabled = isCohortDemoEnabled()) {
  return enabled ? TRACKING_SOURCE_MODE.DEMO : TRACKING_SOURCE_MODE.API;
}

/*
 * Página del listado. `query` es la consulta normalizada
 * (services/trackingQuery.js). Devuelve el cuerpo del contrato o rechaza
 * con { status, codigo }.
 */
export async function listCohortTracking(cohortId, query, options) {
  if (getTrackingSourceMode() === TRACKING_SOURCE_MODE.DEMO) {
    return (await loadTrackingDemoSource()).listCohortTracking(cohortId, query);
  }

  return fetchCohortParticipantIndicators(cohortId, toTrackingParams(query), options);
}

/*
 * Pertenencia a la cohorte. El perfil individual no declara la cohorte,
 * así que antes de pedirlo se comprueba con una fuente autorizada que ya
 * existe: las membresías de la cohorte (`GET /admin/cohortes/:id/participantes`,
 * mismos roles que el listado y sin datos individuales de seguimiento).
 * Solo un miembro ACTIVO, como en el listado, abre la ficha. El estado de
 * navegación del navegador no se usa para esta comprobación.
 */
async function assertActiveMember(cohortId, code) {
  const members = await listCohortParticipants(cohortId);

  if (members === null) throw trackingError(404, 'COHORTE_NO_ENCONTRADA');

  const member = members.find((item) => normalizeParticipantCode(item.code) === code);

  if (!member || member.participationStatus !== PARTICIPATION_STATUS.ACTIVE) {
    throw trackingError(null, TRACKING_CLIENT_ERROR.OUTSIDE_COHORT);
  }
}

/*
 * Ficha individual. En la API solo se acepta un seudónimo A7: con
 * cualquier otro identificador (referencia `seg-…`, UUID, correo, código
 * ficticio) no se hace ninguna petición. Devuelve el cuerpo del contrato,
 * null (204) o rechaza con { status, codigo }.
 */
export async function getParticipantTrackingProfile(cohortId, participantCode, options) {
  if (getTrackingSourceMode() === TRACKING_SOURCE_MODE.DEMO) {
    return (await loadTrackingDemoSource()).getParticipantTrackingProfile(cohortId, participantCode);
  }

  const code = normalizeParticipantCode(participantCode);
  if (!code) throw trackingError(null, TRACKING_CLIENT_ERROR.INVALID_CODE);

  await assertActiveMember(cohortId, code);

  return fetchParticipantTrackingProfile(code, options);
}

/*
 * Historial de alertas del participante (RF-129), solo en la
 * demostración. Consulta propia, con su propia autorización explícita:
 * la de la ficha no la implica. Devuelve { access, cohortId, reference,
 * alerts } o rechaza con `error.code` (TRACKING_QUERY_ERROR).
 */
export async function getParticipantAlertHistory(cohortId, reference) {
  return (await loadTrackingDemoSource()).getParticipantAlertHistory(cohortId, reference);
}
