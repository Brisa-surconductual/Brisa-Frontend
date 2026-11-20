import { REMOVAL_ERROR } from '../types/participantRemoval.js';

/*
 * Textos del retiro de participantes, por código estructurado. Los
 * marcados RF-125 provienen de su flujo alterno; el resto son
 * PROVISIONALES. Ninguno afirma un registro definitivo en el servidor.
 */
export const REMOVAL_ERROR_MESSAGE = Object.freeze({
  // RF-125
  [REMOVAL_ERROR.COHORT_NOT_FOUND]: 'La cohorte seleccionada no existe.',
  // RF-125
  [REMOVAL_ERROR.PARTICIPANT_NOT_FOUND]: 'El participante seleccionado no existe.',
  [REMOVAL_ERROR.NOT_ASSOCIATED]:
    'El participante ya no pertenece a esta cohorte. Se volvió a consultar el listado.',
});

// RF-125: fallo en el almacenamiento; no hubo cambios.
export const REMOVAL_STORAGE_ERROR =
  'No fue posible actualizar la lista de participantes de la cohorte. El participante sigue asociado.';

export const REMOVAL_UNKNOWN_ERROR =
  'No se pudo retirar al participante. La cohorte conserva su lista anterior.';

export function getRemovalErrorMessage(error) {
  return REMOVAL_ERROR_MESSAGE[error] ?? REMOVAL_UNKNOWN_ERROR;
}
