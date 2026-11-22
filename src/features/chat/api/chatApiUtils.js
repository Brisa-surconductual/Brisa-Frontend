import { esApiErrorNormalizado } from '@/shared/utils/apiError.js';

import { nuevoUuid } from '../utils/nuevoUuid.js';

// RF-37: cada petición de la conversación lleva su `X-Request-Id`. El
// backend lo registra y lo devuelve; si no hay respuesta, el error conserva
// el enviado para correlacionarlo.
export const conIdPeticion = (config = {}) => ({
  ...config,
  headers: { ...config.headers, 'X-Request-Id': nuevoUuid() },
});

// Códigos que genera el cliente, no el backend (no están en el contrato 1.3).
export const CHAT_CLIENT_ERROR = Object.freeze({
  SIN_CONEXION: 'SIN_CONEXION',
  RESPUESTA_INVALIDA: 'RESPUESTA_INVALIDA',
  DESCONOCIDO: 'DESCONOCIDO',
});

export function createChatApiError({
  code,
  status = null,
  message = '',
  detalles = null,
  requestId = null,
}) {
  const error = new Error(message || code);
  error.name = 'ChatApiError';
  error.code = code;
  error.status = status;
  error.backendMessage = message;
  error.detalles = detalles;
  error.requestId = requestId;
  return error;
}

const idPeticionDe = (error) =>
  error?.response?.headers?.['x-request-id'] ??
  error?.config?.headers?.['X-Request-Id'] ??
  null;

// El backend usa `message` (filtro de dominio, guards) o `mensaje`
// (excepciones de Nest con cuerpo propio): se lee el que venga.
function leerMensaje(data) {
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.mensaje === 'string') return data.mensaje;
  return '';
}

// Se decide siempre por `codigo` (contrato 1.3), nunca por el texto.
export function toChatApiError(error) {
  if (error?.name === 'ChatApiError') return error;

  // RF-37: un error HTTP ya normalizado por `toApiError` no trae
  // `response`; no es una caída de conexión.
  if (esApiErrorNormalizado(error)) {
    return createChatApiError({
      code: error.codigo,
      status: error.status,
      message: error.mensaje,
      requestId: error.requestId ?? null,
    });
  }

  const response = error?.response;

  if (!response) {
    return createChatApiError({
      code: CHAT_CLIENT_ERROR.SIN_CONEXION,
      requestId: idPeticionDe(error),
    });
  }

  const { data, status } = response;

  return createChatApiError({
    code:
      typeof data?.codigo === 'string'
        ? data.codigo
        : CHAT_CLIENT_ERROR.DESCONOCIDO,
    status,
    message: leerMensaje(data),
    detalles: data?.detalles ?? null,
    requestId: idPeticionDe(error),
  });
}
