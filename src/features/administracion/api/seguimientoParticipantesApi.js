import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

/*
 * Seguimiento de participantes del M08, solo consulta:
 *
 * - RF-142 · GET /admin/cohortes/{id_cohorte}/participantes/indicadores
 *   con `nivel_progreso`, `adherencia_min`, `adherencia_max`,
 *   `con_alertas`, `orden_campo`, `orden_direccion`, `offset` y `limit`.
 *   Filtra, ordena y pagina el backend.
 * - RF-128 · GET /admin/participantes/{codigo_participante}/perfil-seguimiento.
 *   204 cuando M05 no tiene perfil del participante.
 *
 * Los cuerpos se devuelven tal cual (los interpretan los servicios); los
 * errores salen normalizados por `toApiError` ({ status, codigo, mensaje }).
 */
export async function fetchCohortParticipantIndicators(cohortId, params, { signal } = {}) {
  try {
    const response = await apiClient.get(
      `/admin/cohortes/${encodeURIComponent(cohortId)}/participantes/indicadores`,
      { params, signal },
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchParticipantTrackingProfile(participantCode, { signal } = {}) {
  try {
    const response = await apiClient.get(
      `/admin/participantes/${encodeURIComponent(participantCode)}/perfil-seguimiento`,
      { signal },
    );
    return response.status === 204 ? null : response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
