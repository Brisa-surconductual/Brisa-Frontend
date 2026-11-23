import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../types/participantAssignment.js';
import { REMOVAL_ERROR } from '../types/participantRemoval.js';
import {
  BASELINE_STATUS,
  CONSENT_STATUS,
  PARTICIPATION_STATUS,
  REGISTRATION_STATUS,
} from '../types/participantStatus.js';

const participantPath = (cohortId) => `/admin/cohortes/${encodeURIComponent(cohortId)}/participantes`;

const PENDING_MESSAGES = new Map([
  ['REGISTRO_INCOMPLETO', 'El registro aún está incompleto.'],
  ['CONSENTIMIENTO_NO_ACEPTADO', 'El consentimiento informado aún no se ha aceptado.'],
  ['LINEA_BASE_NO_REGISTRADA', 'La línea base aún no está registrada.'],
]);

const ASSIGNMENT_CONFLICTS = new Map([
  ['PARTICIPANTE_YA_ASIGNADO', ASSIGNMENT_ISSUE.ALREADY_ASSIGNED],
  ['PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA', ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT],
]);

const REMOVAL_NOT_FOUND = new Map([
  ['COHORTE_NO_ENCONTRADA', REMOVAL_ERROR.COHORT_NOT_FOUND],
  ['PARTICIPANTE_NO_ENCONTRADO', REMOVAL_ERROR.PARTICIPANT_NOT_FOUND],
  ['PARTICIPANTE_NO_ASIGNADO', REMOVAL_ERROR.NOT_ASSOCIATED],
]);

function readCode(row) {
  const code = row?.codigo_participante;
  if (typeof code !== 'string' || !/^[A-Za-z0-9-]{1,16}$/u.test(code)) {
    throw new Error('La respuesta no incluye un código de participante válido.');
  }
  return code;
}

function toParticipant(row, cohortId) {
  const code = readCode(row);
  if (
    !Object.values(PARTICIPATION_STATUS).includes(row.estado) ||
    !Object.values(REGISTRATION_STATUS).includes(row.estado_registro) ||
    !Object.values(CONSENT_STATUS).includes(row.estado_consentimiento) ||
    !Object.values(BASELINE_STATUS).includes(row.estado_linea_base) ||
    !Array.isArray(row.motivos_pendiente) ||
    !row.motivos_pendiente.every((reason) => typeof reason === 'string')
  ) {
    throw new Error('La respuesta no tiene los datos esperados de la membresía.');
  }
  return {
    id: code,
    code,
    cohortId,
    participationStatus: row.estado,
    registrationStatus: row.estado_registro,
    consentStatus: row.estado_consentimiento,
    baselineStatus: row.estado_linea_base,
    pendingReasons: row.motivos_pendiente.map((reason) => PENDING_MESSAGES.get(reason) ?? reason),
  };
}

async function readList(path, mapRow) {
  let data;
  try {
    ({ data } = await apiClient.get(path));
  } catch (error) {
    const problem = toApiError(error);
    if (problem.status === 404 && problem.codigo === 'COHORTE_NO_ENCONTRADA') return null;
    throw problem;
  }
  if (!Array.isArray(data)) throw new Error('El listado de participantes no es válido.');
  return data.map(mapRow);
}

export function listCohortParticipants(cohortId) {
  return readList(participantPath(cohortId), (row) => toParticipant(row, cohortId));
}

export function listAvailableParticipants(cohortId) {
  return readList(`${participantPath(cohortId)}/elegibles`, (row) => {
    const code = readCode(row);
    return { id: code, code, issue: null };
  });
}

export async function assignParticipants(cohortId, codes) {
  let data;
  try {
    ({ data } = await apiClient.post(participantPath(cohortId), { codigos_participante: codes }));
  } catch (error) {
    const problem = toApiError(error);
    if (problem.status === 404 && problem.codigo === 'COHORTE_NO_ENCONTRADA') {
      return { ok: false, error: ASSIGNMENT_ERROR.COHORT_NOT_FOUND, issues: [], mensaje: problem.mensaje };
    }
    if (problem.status === 404 && problem.codigo === 'PARTICIPANTE_NO_ENCONTRADO') {
      return { ok: false, error: ASSIGNMENT_ERROR.CONFLICT, issues: [], mensaje: problem.mensaje };
    }

    const issue = ASSIGNMENT_CONFLICTS.get(problem.codigo);
    const participantCode = error?.response?.data?.detalles?.codigo_participante;
    if (problem.status === 409 && issue) {
      return {
        ok: false,
        error: ASSIGNMENT_ERROR.CONFLICT,
        issues: codes.includes(participantCode)
          ? [{ participantId: participantCode, code: participantCode, issue }]
          : [],
        mensaje: problem.mensaje,
      };
    }
    throw problem;
  }
  if (!Array.isArray(data)) throw new Error('La respuesta de asignación no es válida.');
  const assigned = data.map((row) => toParticipant(row, cohortId));
  const returned = new Set(assigned.map(({ id }) => id));
  if (assigned.length !== codes.length || codes.some((code) => !returned.has(code))) {
    throw new Error('La respuesta no confirma el lote completo de participantes.');
  }
  return { ok: true, assigned };
}

export async function removeCohortParticipant(cohortId, code) {
  let data;
  try {
    ({ data } = await apiClient.delete(`${participantPath(cohortId)}/${encodeURIComponent(code)}`));
  } catch (error) {
    const problem = toApiError(error);
    const reason = REMOVAL_NOT_FOUND.get(problem.codigo);
    if (problem.status === 404 && reason) return { ok: false, error: reason, mensaje: problem.mensaje };
    throw problem;
  }
  const removed = toParticipant(data, cohortId);
  if (removed.code !== code || removed.participationStatus !== PARTICIPATION_STATUS.INACTIVE) {
    throw new Error('La respuesta no confirma el retiro del participante.');
  }
  return { ok: true, removed };
}
