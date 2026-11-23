import { TRACE_QUERY_STATUS } from '../types/chatTraceability.js';

import { isUuid } from './chatTraceabilityIds.js';

/*
 * Listado de sesiones de un participante
 * (GET /chat/admin/participantes/{codigo}/sesiones, RF-38). Reglas:
 *
 * 1. La respuesta debe ser del participante pedido (`id_participante`);
 *    si no, no se muestra nada (MISMATCH).
 * 2. Lista explícita de campos: solo se proyectan id_sesion, modalidad,
 *    estado, fecha_inicio y fecha_ultima_interaccion. Cualquier otro
 *    campo que llegue se descarta.
 * 3. `total` es el total sin paginar: no equivale a los elementos
 *    cargados. `siguiente_cursor` es opaco: se guarda tal cual, sin
 *    decodificarlo ni modificarlo.
 * 4. Una respuesta que no cumple el contrato no deja datos
 *    (INVALID_RESPONSE). Las sesiones SOS se conservan.
 */
const nonEmptyText = (value) => typeof value === 'string' && value.trim() !== '';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const failure = (status) => Object.freeze({ ok: false, status });

function toSession(item) {
  if (
    !isPlainObject(item) ||
    !isUuid(item.id_sesion) ||
    !nonEmptyText(item.modalidad) ||
    !nonEmptyText(item.estado) ||
    typeof item.fecha_inicio !== 'string' ||
    typeof item.fecha_ultima_interaccion !== 'string'
  ) {
    return null;
  }

  return Object.freeze({
    id: item.id_sesion.toLowerCase(),
    modality: item.modalidad,
    state: item.estado,
    startedAt: item.fecha_inicio,
    lastInteractionAt: item.fecha_ultima_interaccion,
  });
}

export function interpretParticipantSessions(data, { code }) {
  if (!isPlainObject(data)) return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);

  if (data.id_participante !== code) return failure(TRACE_QUERY_STATUS.MISMATCH);

  const { items, total } = data;
  const cursor = data.siguiente_cursor;

  if (
    !Array.isArray(items) ||
    !Number.isInteger(total) ||
    total < items.length ||
    !(cursor === null || nonEmptyText(cursor))
  ) {
    return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);
  }

  const sessions = items.map(toSession);
  const ids = new Set(sessions.map((session) => session?.id));

  if (sessions.includes(null) || ids.size !== sessions.length) {
    return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);
  }

  return Object.freeze({
    ok: true,
    page: Object.freeze({
      code,
      sessions: Object.freeze(sessions),
      total,
      nextCursor: cursor,
    }),
  });
}

/*
 * Agrega la página siguiente a la ya cargada del MISMO participante. Una
 * sesión repetida indica un cursor o un orden inconsistente: la página
 * nueva se descarta y se conserva lo ya mostrado.
 */
export function appendSessionsPage(current, next) {
  if (!current || !next || current.code !== next.code) {
    return failure(TRACE_QUERY_STATUS.MISMATCH);
  }

  const loaded = new Set(current.sessions.map(({ id }) => id));

  if (next.sessions.some(({ id }) => loaded.has(id))) {
    return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);
  }

  return Object.freeze({
    ok: true,
    page: Object.freeze({
      code: current.code,
      sessions: Object.freeze([...current.sessions, ...next.sessions]),
      total: next.total,
      nextCursor: next.nextCursor,
    }),
  });
}
