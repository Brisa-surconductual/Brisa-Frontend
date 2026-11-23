import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { COHORT_TRANSITION, TRANSITION_REJECTION } from '../services/cohortTransitions.js';
import { COHORT_STATUS } from '../types/cohortStatus.js';

const COHORTES = '/admin/cohortes';
const cohortPath = (id) => `${COHORTES}/${encodeURIComponent(id)}`;
const TRANSITION_TARGET = {
  [COHORT_TRANSITION.ACTIVATE]: COHORT_STATUS.ACTIVE,
  [COHORT_TRANSITION.INACTIVATE]: COHORT_STATUS.INACTIVE,
};

function toCohort(row) {
  if (
    typeof row?.id_cohorte !== 'string' ||
    typeof row.nombre_cohorte !== 'string' ||
    typeof row.id_cronograma !== 'string' ||
    !Object.values(COHORT_STATUS).includes(row.estado) ||
    typeof row.fecha_inicio_programa !== 'string' ||
    typeof row.fecha_fin_programa !== 'string'
  ) {
    throw new Error('La respuesta de cohortes no tiene el formato esperado.');
  }
  return {
    id: row.id_cohorte,
    name: row.nombre_cohorte,
    startDate: row.fecha_inicio_programa,
    endDate: row.fecha_fin_programa,
    scheduleId: row.id_cronograma,
    status: row.estado,
    updatedAt: row.fecha_actualizacion,
    ...(typeof row.nombre_cronograma === 'string' && { scheduleName: row.nombre_cronograma }),
  };
}

function toPayload({ name, startDate, endDate, scheduleId }) {
  return {
    nombre_cohorte: name,
    fecha_inicio_programa: startDate,
    fecha_fin_programa: endDate,
    id_cronograma: scheduleId,
  };
}

async function responseData(request) {
  try {
    return (await request).data;
  } catch (error) {
    throw toApiError(error);
  }
}

const isMissingCohort = (error) =>
  error?.status === 404 && error.codigo === 'COHORTE_NO_ENCONTRADA';

export async function listCohorts() {
  const rows = await responseData(apiClient.get(COHORTES));
  if (!Array.isArray(rows)) throw new Error('El listado de cohortes no es válido.');
  return rows.map(toCohort);
}

export async function getCohort(id) {
  try {
    return toCohort(await responseData(apiClient.get(cohortPath(id))));
  } catch (error) {
    if (isMissingCohort(error)) return null;
    throw error;
  }
}

export async function listSchedules() {
  const rows = await responseData(apiClient.get('/cronograma/obtener-cronogramas'));
  if (!Array.isArray(rows)) throw new Error('El catálogo de cronogramas no es válido.');
  return rows.map(({ idCronograma, nombreCronograma, estado }) => ({
    id: idCronograma,
    name: nombreCronograma,
    status: estado,
  }));
}

export async function createCohort(values) {
  return toCohort(await responseData(apiClient.post(COHORTES, toPayload(values))));
}

export async function updateCohort(id, values) {
  try {
    return toCohort(await responseData(apiClient.patch(cohortPath(id), toPayload(values))));
  } catch (error) {
    if (isMissingCohort(error)) return null;
    throw error;
  }
}

export async function changeCohortStatus(id, transition) {
  if (!Object.hasOwn(TRANSITION_TARGET, transition)) {
    return { ok: false, reason: TRANSITION_REJECTION.NOT_ALLOWED };
  }
  const estado = TRANSITION_TARGET[transition];

  try {
    const cohort = toCohort(await responseData(apiClient.patch(cohortPath(id), { estado })));
    return { ok: true, cohort };
  } catch (error) {
    if (isMissingCohort(error)) return { ok: false, message: error.mensaje };
    if (error?.status === 409 && error.codigo === 'TRANSICION_COHORTE_INVALIDA') {
      const cohort = await getCohort(id).catch(() => null);
      return { ok: false, reason: TRANSITION_REJECTION.NOT_ALLOWED, message: error.mensaje, cohort };
    }
    throw error;
  }
}
