import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';

import { PERMISSION_ERROR } from '../types/permissionScope.js';

/*
 * Textos de respaldo de los permisos individuales, por código. Solo se usan
 * si el backend no envía `mensaje`: su texto se muestra tal cual (A-075).
 * PROVISIONALES.
 */
const PERMISSION_ERROR_MESSAGE = Object.freeze({
  [PERMISSION_ERROR.ALREADY_ACTIVE]:
    'Ya hay un permiso vigente con este alcance.',
  [PERMISSION_ERROR.SELF_GRANT_FORBIDDEN]:
    'No puedes concederte un permiso a ti mismo.',
  [PERMISSION_ERROR.PARTICIPANT_NOT_FOUND]: 'El participante no existe.',
  [PERMISSION_ERROR.ALREADY_REVOKED]:
    'El permiso ya estaba revocado o vencido. Se actualizó la lista.',
  [API_ERROR_CLIENTE.SIN_CONEXION]:
    'No hay conexión con el servidor. Inténtalo de nuevo.',
});

export const PERMISSION_UNKNOWN_ERROR =
  'No se pudo completar la operación con el permiso.';

export const PERMISSION_FORM_MESSAGE = Object.freeze({
  SCOPE_REQUIRED: 'Selecciona el alcance del permiso.',
  END_DATE_INVALID: 'Escribe una fecha válida.',
  END_DATE_TOO_EARLY: 'La fecha de fin debe ser posterior a hoy.',
});

export function getPermissionErrorMessage(codigo) {
  return PERMISSION_ERROR_MESSAGE[codigo] ?? PERMISSION_UNKNOWN_ERROR;
}
