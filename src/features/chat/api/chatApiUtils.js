// Códigos que genera el cliente, no el backend (no están en el contrato 1.3).
export const CHAT_CLIENT_ERROR = Object.freeze({
  SIN_CONEXION: 'SIN_CONEXION',
  RESPUESTA_INVALIDA: 'RESPUESTA_INVALIDA',
  DESCONOCIDO: 'DESCONOCIDO',
});

export function createChatApiError({ code, status = null, message = '' }) {
  const error = new Error(message || code);
  error.name = 'ChatApiError';
  error.code = code;
  error.status = status;
  error.backendMessage = message;
  return error;
}

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

  const response = error?.response;

  if (!response) {
    return createChatApiError({ code: CHAT_CLIENT_ERROR.SIN_CONEXION });
  }

  const { data, status } = response;

  return createChatApiError({
    code:
      typeof data?.codigo === 'string'
        ? data.codigo
        : CHAT_CLIENT_ERROR.DESCONOCIDO,
    status,
    message: leerMensaje(data),
  });
}
