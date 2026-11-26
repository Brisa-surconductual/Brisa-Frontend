import { fetchParticipantExportCsv } from '../api/participantExportApi.js';
import { PARTICIPANT_EXPORT_SOURCE_MODE } from '../types/participantExport.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

const DEMO_UNAVAILABLE = 'La exportación individual no está disponible en la demostración.';

/*
 * Fuente de la exportación individual (RF-145). En la demostración los
 * participantes y las fichas son ficticios: no se pide ningún archivo al
 * servidor ni se genera un CSV que aparente estar auditado. No hay
 * simulador para esta exportación.
 */
export function getParticipantExportSourceMode(enabled = isCohortDemoEnabled()) {
  return enabled ? PARTICIPANT_EXPORT_SOURCE_MODE.DEMO_UNAVAILABLE : PARTICIPANT_EXPORT_SOURCE_MODE.API;
}

export async function exportParticipantCsv(participantCode, options) {
  if (getParticipantExportSourceMode() !== PARTICIPANT_EXPORT_SOURCE_MODE.API) {
    throw new Error(DEMO_UNAVAILABLE);
  }

  return fetchParticipantExportCsv(participantCode, options);
}
