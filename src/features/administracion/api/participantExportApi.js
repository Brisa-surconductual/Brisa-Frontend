import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { normalizeParticipantCode } from '../services/chatTraceabilityIds.js';
import {
  InvalidParticipantExportResponse,
  readParticipantExportResponse,
} from '../services/participantExportResponse.js';
import { PARTICIPANT_EXPORT_ERROR as E } from '../types/participantExport.js';

/*
 * Exportación CSV individual (RF-145):
 * GET /admin/participantes/{codigo_participante}/exportacion.csv.
 * Va por `apiClient` (cookie de sesión), nunca por un enlace directo. El
 * backend audita la exportación antes de enviar el archivo; aquí no se
 * registra nada por separado.
 */
function errorCode({ status }) {
  if (status === null) return E.CONNECTION;
  if (status === 400) return E.INVALID_CODE;
  if (status === 401) return E.SESSION_REQUIRED;
  if (status === 403) return E.FORBIDDEN;
  if (status === 404) return E.NOT_FOUND;
  if (status === 409) return E.INCONSISTENT;
  if (status === 422) return E.NO_INDICATORS;
  if (status === 503) return E.UNAVAILABLE;
  // 500 EXPORTACION_ABORTADA y cualquier otro fallo: sin archivo.
  return E.ABORTED;
}

// Con `responseType: 'blob'` el cuerpo JSON del error llega como Blob.
async function readErrorBody(data) {
  if (!(data instanceof Blob)) return data;

  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
}

async function normalizeExportError(error) {
  const response = error?.response;
  const data = response ? await readErrorBody(response.data) : undefined;
  const problem = toApiError({
    response: response && { ...response, data },
    config: error?.config,
  });

  return { status: problem.status, codigo: problem.codigo, code: errorCode(problem) };
}

export async function fetchParticipantExportCsv(participantCode, { signal } = {}) {
  const code = normalizeParticipantCode(participantCode);
  // Nunca se envía una referencia opaca, un UUID ni un texto arbitrario.
  if (!code) throw { status: null, codigo: null, code: E.INVALID_CODE };

  let response;
  try {
    response = await apiClient.get(`/admin/participantes/${encodeURIComponent(code)}/exportacion.csv`, {
      responseType: 'blob',
      signal,
    });
  } catch (error) {
    throw await normalizeExportError(error);
  }

  try {
    return await readParticipantExportResponse(response);
  } catch (error) {
    if (error instanceof InvalidParticipantExportResponse) {
      throw { status: response?.status ?? null, codigo: null, code: E.INVALID_RESPONSE };
    }
    throw error;
  }
}
