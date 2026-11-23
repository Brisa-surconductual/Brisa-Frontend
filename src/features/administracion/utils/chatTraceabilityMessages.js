import {
  AlertTriangle,
  CloudOff,
  FileWarning,
  SearchX,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';

import { TRACE_QUERY_STATUS } from '../types/chatTraceability.js';

/*
 * Avisos de los estados sin datos de la trazabilidad (RF-38). El título
 * es de la interfaz; el texto visible es el `mensaje` del backend cuando
 * llega (ADR-0004, D1) y, si no, el texto de respaldo. Los textos de
 * conexión y de error inesperado son los de ADR-0004, D2.
 */
const TEXT_NO_CONNECTION = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
const TEXT_UNEXPECTED = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

const notice = (tone, icon, title, fallback) => Object.freeze({ tone, icon, title, fallback });

export const TRACE_NOTICE = Object.freeze({
  [TRACE_QUERY_STATUS.INVALID_REQUEST]: notice(
    'warning', FileWarning, 'Solicitud no válida',
    'Los datos de la consulta no son válidos.',
  ),
  [TRACE_QUERY_STATUS.DENIED]: notice(
    'warning', ShieldX, 'Acceso denegado',
    'No tiene permisos para consultar la trazabilidad de sesiones.',
  ),
  [TRACE_QUERY_STATUS.PARTICIPANT_NOT_FOUND]: notice(
    'neutral', SearchX, 'Participante no encontrado',
    'No se encontró el participante solicitado.',
  ),
  [TRACE_QUERY_STATUS.SESSION_NOT_FOUND]: notice(
    'neutral', SearchX, 'Sesión no encontrada',
    'La sesión no existe o no pertenece a este participante.',
  ),
  [TRACE_QUERY_STATUS.INCONSISTENT_HISTORY]: notice(
    'danger', ShieldAlert, 'Historial inconsistente',
    'El historial de esta sesión no superó la verificación de integridad. No se muestra para evitar una reconstrucción incorrecta.',
  ),
  [TRACE_QUERY_STATUS.MISMATCH]: notice(
    'danger', ShieldAlert, 'Información no mostrada',
    'La respuesta no corresponde a la consulta solicitada. Por seguridad no se muestra.',
  ),
  [TRACE_QUERY_STATUS.INVALID_RESPONSE]: notice(
    'danger', AlertTriangle, 'Respuesta no válida',
    'La respuesta del servidor no tiene el formato esperado. No se muestra información parcial.',
  ),
  [TRACE_QUERY_STATUS.CONNECTION_ERROR]: notice(
    'warning', CloudOff, 'Sin conexión', TEXT_NO_CONNECTION,
  ),
  [TRACE_QUERY_STATUS.SERVER_ERROR]: notice(
    'danger', AlertTriangle, 'Consulta no disponible', TEXT_UNEXPECTED,
  ),
});

// Errores del cliente (sin conexión, respuesta inválida o ajena) usan su
// propio texto; los del servidor, el `mensaje` que haya enviado.
const OWN_TEXT = Object.freeze([
  TRACE_QUERY_STATUS.CONNECTION_ERROR,
  TRACE_QUERY_STATUS.MISMATCH,
  TRACE_QUERY_STATUS.INVALID_RESPONSE,
]);

export function traceNoticeText(status, message) {
  const fallback = TRACE_NOTICE[status]?.fallback ?? TEXT_UNEXPECTED;

  if (OWN_TEXT.includes(status)) return fallback;

  return typeof message === 'string' && message.trim() !== '' ? message : fallback;
}
