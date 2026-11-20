import {
  READ_ONLY_ERROR_CODE,
  READ_ONLY_HTTP_STATUS,
  READ_ONLY_MESSAGE,
} from '../types/readOnlyRestriction.js';

/*
 * Reconocimiento del rechazo de escritura de RF-148. Función pura: no
 * hace peticiones, no registra nada y no compara textos.
 *
 * Es un rechazo de solo lectura SOLO si hay a la vez:
 *   - un estado HTTP verificable igual a 403, en `error.response.status`
 *     o `error.status` (si ambos existen y difieren, no es verificable);
 *   - el código ESCRITURA_NO_PERMITIDA, en `error.response.data.codigo`
 *     (cuerpo del servidor) o, si el servidor no envía código, en
 *     `error.code`. El cuerpo del servidor manda: axios rellena
 *     `error.code` con sus propios códigos (p. ej. ERR_BAD_REQUEST).
 *
 * Un 403 de CSRF o de acceso al módulo (RF-122), un código sin estado
 * o un mensaje que mencione el código no cuentan. Las variantes
 * admitidas son PROVISIONALES hasta confirmar la forma de ErrorApi.
 */
function statusOf(error) {
  const fromResponse = error?.response?.status;
  const direct = error?.status;
  const statuses = [fromResponse, direct].filter(Number.isInteger);

  if (statuses.length === 0) return null;

  return statuses.every((status) => status === statuses[0]) ? statuses[0] : null;
}

function codeOf(error) {
  const fromBody = error?.response?.data?.codigo;

  if (fromBody !== undefined && fromBody !== null) {
    return typeof fromBody === 'string' ? fromBody : null;
  }

  return typeof error?.code === 'string' ? error.code : null;
}

export function isReadOnlyRejection(error) {
  if (error === null || typeof error !== 'object') return false;

  return statusOf(error) === READ_ONLY_HTTP_STATUS && codeOf(error) === READ_ONLY_ERROR_CODE;
}

export function getReadOnlyMessage() {
  return READ_ONLY_MESSAGE;
}
