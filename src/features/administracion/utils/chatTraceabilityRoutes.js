import {
  normalizeParticipantCode,
  normalizeSessionId,
} from '../services/chatTraceabilityIds.js';

/*
 * Rutas de la trazabilidad administrativa de sesiones (RF-38). Solo
 * llevan el seudónimo A7 y el UUID de la sesión: nunca respuestas,
 * textos, correos ni el UUID del estudiante. Con un identificador
 * inválido devuelven null y no se construye ningún enlace.
 */
export const CHAT_PARTICIPANTS_PATH = '/app/administrativo/chat/participantes';

const ADMIN_PREFIX = '/app/administrativo/';

export function getParticipantSessionsPath(participantCode) {
  const code = normalizeParticipantCode(participantCode);

  return code ? `${CHAT_PARTICIPANTS_PATH}/${encodeURIComponent(code)}/sesiones` : null;
}

export function getSessionTraceabilityPath(participantCode, sessionId) {
  const sessions = getParticipantSessionsPath(participantCode);
  const id = normalizeSessionId(sessionId);

  return sessions && id ? `${sessions}/${encodeURIComponent(id)}/trazabilidad` : null;
}

/*
 * Destino de «Volver» recibido en el estado de navegación. Solo se acepta
 * una ruta interna del área administrativa; cualquier otra cosa (URL
 * absoluta, `//host`, barras invertidas) se ignora.
 */
export function safeAdminReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith(ADMIN_PREFIX)) return null;
  if (value.includes('//') || value.includes('\\')) return null;

  return value;
}
