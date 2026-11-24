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
  )
    return false;

  if (data.estado === AGGREGATE_VIEW_STATE.NOT_AVAILABLE)
    return data.datos === null;

  return (
    data.estado === AGGREGATE_VIEW_STATE.STALE &&
    data.datos !== null &&
    typeof data.datos === 'object' &&
    !Array.isArray(data.datos)
  );
}

async function getCohortAggregateFromApi(
  cohortId,
  path,
  { acceptBackup = true } = {},
) {
  try {
    const { data } = await apiClient.get(
      `/admin/cohortes/${encodeURIComponent(cohortId)}/${path}`,
    );
    return data;
  } catch (error) {
    const response = error?.response;
    // Las vistas agregadas conservan la envoltura en 503. El intérprete valida la cohorte.
    if (
      acceptBackup &&
      response?.status === 503 &&
      isDegradedView(response.data)
    )
      return response.data;

    const problem = toApiError(error);
    if (
      problem.status === 404 &&
      problem.codigo === 'COHORTE_ACTIVA_NO_ENCONTRADA'
    ) {
      throw Object.assign(new Error(problem.mensaje), problem, {
        code: AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
      });
    }
    throw problem;
  }
}

export function getBehavioralAggregateFromApi(cohortId) {
  return getCohortAggregateFromApi(cohortId, 'vista-agregada');
}

export function getNarrativeAggregateFromApi(cohortId) {
  return getCohortAggregateFromApi(cohortId, 'vistas/narrativa');
}

export function getNotificationAggregateFromApi(cohortId) {
  return getCohortAggregateFromApi(cohortId, 'vistas/notificaciones');
}

export function getCohortEvolutionFromApi(cohortId) {
  return getCohortAggregateFromApi(cohortId, 'evolucion', {
    acceptBackup: false,
  });
}
