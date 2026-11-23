/*
 * Asignación de participantes a una cohorte (RF-125).
 *
 * Códigos estructurados que devuelve la fuente de datos: la interfaz
 * decide su flujo con ellos. El adaptador mapea los errores HTTP del
 * contrato RF-125 a estos códigos de presentación.
 */

// Motivo por el que un participante concreto no puede asignarse.
export const ASSIGNMENT_ISSUE = Object.freeze({
  // RF-125: «El participante ya se encuentra asignado a esta cohorte.»
  ALREADY_ASSIGNED: 'YA_ASIGNADO',
  ASSIGNED_TO_ACTIVE_COHORT: 'ASIGNADO_OTRA_COHORTE_ACTIVA',
  // Caso del catálogo de demostración.
  PARTICIPANT_UNAVAILABLE: 'NO_DISPONIBLE',
  // RF-125: «El participante seleccionado no existe.»
  PARTICIPANT_NOT_FOUND: 'PARTICIPANTE_NO_ENCONTRADO',
});

// Motivo por el que se rechaza la solicitud completa.
export const ASSIGNMENT_ERROR = Object.freeze({
  EMPTY_SELECTION: 'SIN_SELECCION',
  COHORT_NOT_FOUND: 'COHORTE_NO_ENCONTRADA',
  // Algún participante tiene un `ASSIGNMENT_ISSUE`: no se asigna ninguno.
  CONFLICT: 'CONFLICTO',
});
