import { API_ERROR_CLIENTE } from '@/shared/utils/apiError.js';

import { TRACE_QUERY_STATUS } from '../types/chatTraceability.js';

const STATUS_BY_CODE_404 = Object.freeze({
  PARTICIPANTE_NO_ENCONTRADO: TRACE_QUERY_STATUS.PARTICIPANT_NOT_FOUND,
  SESION_NO_ENCONTRADA: TRACE_QUERY_STATUS.SESSION_NOT_FOUND,
});

/*
 * Situación de un error ya normalizado por `toApiError`
 * ({ status, codigo, mensaje, reintentable }). Se decide por estado HTTP
 * y `codigo`, nunca por el texto (ADR-0004). `message` es el `mensaje`
 * del backend tal cual (puede ser vacío). Reintentar solo sin respuesta
 * o ante 5xx (ADR-0004, D3), y siempre por acción del usuario.
 */
export function classifyTraceError(error) {
  const message = typeof error?.mensaje === 'string' ? error.mensaje : '';
  const result = (status, canRetry = false) =>
    Object.freeze({ status, message, canRetry });

  if (error?.codigo === API_ERROR_CLIENTE.SIN_CONEXION) {
    return result(TRACE_QUERY_STATUS.CONNECTION_ERROR, true);
  }

  const status = error?.status;

  if (status === 400) return result(TRACE_QUERY_STATUS.INVALID_REQUEST);
  if (status === 401) return result(TRACE_QUERY_STATUS.UNAUTHENTICATED);
  if (status === 403) return result(TRACE_QUERY_STATUS.DENIED);

  if (status === 404 && STATUS_BY_CODE_404[error?.codigo]) {
    return result(STATUS_BY_CODE_404[error.codigo]);
  }

  if (status === 422 && error?.codigo === 'HISTORIAL_INCONSISTENTE') {
    return result(TRACE_QUERY_STATUS.INCONSISTENT_HISTORY);
  }

  // 5xx (incluido el fallo de la auditoría RF-123, que llega como 500
  // sin datos), un 404 sin código conocido o cualquier otro estado.
  return result(
    TRACE_QUERY_STATUS.SERVER_ERROR,
    typeof status === 'number' && status >= 500,
  );
}
