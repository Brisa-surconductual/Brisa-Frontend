import { ASSIGNMENT_ERROR, ASSIGNMENT_ISSUE } from '../types/participantAssignment.js';

/*
 * Textos de la asignación de participantes, por código estructurado.
 * Los marcados RF-125 son los mensajes de su flujo alterno; el resto
 * son PROVISIONALES hasta que el backend defina los suyos.
 */
export const ASSIGNMENT_ISSUE_MESSAGE = Object.freeze({
  // RF-125
  [ASSIGNMENT_ISSUE.ALREADY_ASSIGNED]: 'El participante ya se encuentra asignado a esta cohorte.',
  [ASSIGNMENT_ISSUE.ASSIGNED_TO_ACTIVE_COHORT]: 'El participante pertenece a otra cohorte activa.',
  [ASSIGNMENT_ISSUE.PARTICIPANT_UNAVAILABLE]: 'El participante no está disponible para asignación.',
  // RF-125
  [ASSIGNMENT_ISSUE.PARTICIPANT_NOT_FOUND]: 'El participante seleccionado no existe.',
});

export const ASSIGNMENT_ERROR_MESSAGE = Object.freeze({
  [ASSIGNMENT_ERROR.EMPTY_SELECTION]: 'Selecciona al menos un participante para asignar.',
  // RF-125
  [ASSIGNMENT_ERROR.COHORT_NOT_FOUND]: 'La cohorte seleccionada no existe.',
  [ASSIGNMENT_ERROR.CONFLICT]:
    'No se asignó ningún participante porque algunos no pueden incorporarse. Quítalos de la selección e inténtalo de nuevo.',
});

// RF-125: fallo en el almacenamiento de la asignación.
export const ASSIGNMENT_STORAGE_ERROR =
  'No fue posible actualizar la lista de participantes de la cohorte. No se asignó ningún participante.';

export const CATALOG_LOAD_ERROR =
  'No pudimos cargar los participantes disponibles. Intenta nuevamente.';

export const UNKNOWN_ISSUE_MESSAGE = 'El participante no puede asignarse a esta cohorte.';

export function getAssignmentIssueMessage(issue) {
  return ASSIGNMENT_ISSUE_MESSAGE[issue] ?? UNKNOWN_ISSUE_MESSAGE;
}
