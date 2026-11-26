/*
 * Retiro de un participante de una cohorte (RF-125).
 *
 * Códigos de la fuente que usa la interfaz. El adaptador traduce los
 * errores HTTP. Un retiro confirmado por la API conserva la membresía
 * como INACTIVO.
 */
export const REMOVAL_ERROR = Object.freeze({
  // RF-125: «La cohorte seleccionada no existe.»
  COHORT_NOT_FOUND: 'COHORTE_NO_ENCONTRADA',
  // RF-125: «El participante seleccionado no existe.»
  PARTICIPANT_NOT_FOUND: 'PARTICIPANTE_NO_ENCONTRADO',
  // Ya no hay una membresía vigente para retirar.
  NOT_ASSOCIATED: 'NO_ASOCIADO',
});
