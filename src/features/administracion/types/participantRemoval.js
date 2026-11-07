/*
 * Retiro de un participante de una cohorte (RF-125).
 *
 * SEMÁNTICA PROVISIONAL, pendiente de confirmar con el backend: retirar
 * elimina solo la asociación del participante con esa cohorte. No lo
 * borra del sistema, no lo pasa a INACTIVO, no cambia su registro,
 * consentimiento ni línea base, y no toca otras cohortes.
 *
 * Códigos estructurados que devuelve la fuente; la interfaz decide con
 * ellos, nunca con textos. No son códigos HTTP definitivos.
 */
export const REMOVAL_ERROR = Object.freeze({
  // RF-125: «La cohorte seleccionada no existe.»
  COHORT_NOT_FOUND: 'COHORTE_NO_ENCONTRADA',
  // RF-125: «El participante seleccionado no existe.»
  PARTICIPANT_NOT_FOUND: 'PARTICIPANTE_NO_ENCONTRADO',
  // PROVISIONAL: ya no pertenece a la cohorte (retiro repetido o datos
  // desactualizados por otra operación).
  NOT_ASSOCIATED: 'NO_ASOCIADO',
});
