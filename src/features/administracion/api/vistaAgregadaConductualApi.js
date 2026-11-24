import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_VIEW_STATE,
  AGGREGATION_STATE,
} from '../types/behavioralAggregate.js';

function isDegradedView(data) {
  if (
    typeof data?.id_cohorte !== 'string' ||
    data.estado_agregacion !== AGGREGATION_STATE.UPDATE_ERROR
  ) return false;

  if (data.estado === AGGREGATE_VIEW_STATE.NOT_AVAILABLE) return data.datos === null;

  return data.estado === AGGREGATE_VIEW_STATE.STALE &&
    data.datos !== null &&
    typeof data.datos === 'object' &&
    !Array.isArray(data.datos);
}

export async function getBehavioralAggregateFromApi(cohortId) {
  try {
    const { data } = await apiClient.get(
      `/admin/cohortes/${encodeURIComponent(cohortId)}/vista-agregada`,
    );
    return data;
  } catch (error) {
    const response = error?.response;
    // RF-132 conserva la envoltura en 503. El intérprete valida la cohorte.
    if (response?.status === 503 && isDegradedView(response.data)) return response.data;

    const problem = toApiError(error);
    if (problem.status === 404 && problem.codigo === 'COHORTE_ACTIVA_NO_ENCONTRADA') {
      throw Object.assign(new Error(problem.mensaje), problem, {
        code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
      });
    }
    throw problem;
  }
}
