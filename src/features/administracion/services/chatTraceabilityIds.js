import { PARTICIPANT_CODE_PATTERN } from '../types/chatTraceability.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
 * Seudónimo A7 en mayúscula, o null si no tiene el formato. Un UUID, un
 * correo o una referencia opaca de M08 (p. ej. `seg-…`) nunca son un
 * código válido: no se derivan ni se completan.
 */
export function normalizeParticipantCode(value) {
  if (typeof value !== 'string') return null;

  const code = value.trim().toUpperCase();

  return PARTICIPANT_CODE_PATTERN.test(code) ? code : null;
}

// Identificador de sesión (UUID) en minúscula, o null.
export function normalizeSessionId(value) {
  if (typeof value !== 'string') return null;

  const id = value.trim();

  return UUID_PATTERN.test(id) ? id.toLowerCase() : null;
}

export const isUuid = (value) =>
  typeof value === 'string' && UUID_PATTERN.test(value);
