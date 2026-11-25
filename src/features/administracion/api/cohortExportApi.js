import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { readCohortExportResponse } from '../services/cohortExportResponse.js';
import { EXPORT_ERROR } from '../types/cohortExport.js';

function errorCode({ status, codigo }) {
  if (status === 401) return EXPORT_ERROR.SESSION_REQUIRED;
  if (status === 403) return EXPORT_ERROR.FORBIDDEN;
  if (status === 422 && codigo === 'COHORTE_NO_ACTIVA')
    return EXPORT_ERROR.COHORT_NOT_ACTIVE;
  if (status === 422 && codigo === 'SIN_INDICADORES_CONSOLIDADOS')
    return EXPORT_ERROR.NO_INDICATORS;
  if (status === 500 && codigo === 'ERROR_REGISTRO_AUDITORIA')
    return EXPORT_ERROR.AUDIT_UNAVAILABLE;
  return EXPORT_ERROR.GENERATION_FAILED;
}

async function normalizeExportError(error) {
  const response = error?.response;
  let data = response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }
  const problem = toApiError({
    response: response && { ...response, data },
    config: error?.config,
  });
  return { ...problem, code: errorCode(problem) };
}

export async function fetchCohortExportCsv(cohortId, { signal } = {}) {
  let response;
  try {
    response = await apiClient.get(
      `/admin/cohortes/${encodeURIComponent(cohortId)}/exportacion.csv`,
      { responseType: 'blob', signal },
    );
  } catch (error) {
    throw await normalizeExportError(error);
  }

  return readCohortExportResponse(response);
}
