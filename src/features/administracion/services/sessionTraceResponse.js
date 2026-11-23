import {
  HISTORICAL_CONTENT,
  TRACE_QUERY_STATUS,
} from '../types/chatTraceability.js';

import { isUuid } from './chatTraceabilityIds.js';

/*
 * Trazabilidad de una sesión (GET /chat/admin/sesiones/{id}/trazabilidad,
 * RF-38). Reglas:
 *
 * 1. Aislamiento: `id_sesion` e `id_participante` deben ser los pedidos;
 *    si no, no se muestra ningún registro (MISMATCH).
 * 2. `respuesta_usuario.valor` se conserva sin modificar (RF-27):
 *    número, booleano, texto, arreglo, objeto o null.
 * 3. Solo un registro VERIFICADO conserva `tipo_nodo`, `texto_nodo` y
 *    `etiqueta_respuesta`. En cualquier otro caso esos campos se
 *    descartan aunque lleguen: no se presentan como contenido histórico
 *    confirmado.
 * 4. Orden ascendente por `secuencia`; una secuencia repetida o no
 *    entera invalida la respuesta completa (INVALID_RESPONSE).
 * 5. Lista explícita de campos: lo que no está aquí no se proyecta.
 */
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const textOrNull = (value) => value === null || typeof value === 'string';

const isLabel = (value) =>
  value === null ||
  typeof value === 'string' ||
  (Array.isArray(value) && value.every((item) => typeof item === 'string'));

const failure = (status) => Object.freeze({ ok: false, status });

function toRecord(item) {
  if (
    !isPlainObject(item) ||
    !Number.isInteger(item.secuencia) ||
    item.secuencia < 1 ||
    !isUuid(item.id_nodo) ||
    !(item.id_nodo_destino === null || isUuid(item.id_nodo_destino)) ||
    typeof item.timestamp_interaccion !== 'string' ||
    typeof item.tipo_entrada !== 'string' ||
    item.tipo_entrada.trim() === '' ||
    !isPlainObject(item.respuesta_usuario) ||
    !Object.hasOwn(item.respuesta_usuario, 'valor') ||
    item.respuesta_usuario.valor === undefined
  ) {
    return null;
  }

  const verified =
    item.contenido_historico === HISTORICAL_CONTENT.VERIFIED &&
    item.motivo_no_verificable === null;

  if (
    verified &&
    !(textOrNull(item.tipo_nodo) && textOrNull(item.texto_nodo) && isLabel(item.etiqueta_respuesta))
  ) {
    return null;
  }

  const label = verified ? item.etiqueta_respuesta : null;

  return Object.freeze({
    sequence: item.secuencia,
    nodeId: item.id_nodo.toLowerCase(),
    nextNodeId: item.id_nodo_destino === null ? null : item.id_nodo_destino.toLowerCase(),
    at: item.timestamp_interaccion,
    inputType: item.tipo_entrada,
    value: item.respuesta_usuario.valor,
    verified,
    reason:
      !verified && typeof item.motivo_no_verificable === 'string'
        ? item.motivo_no_verificable
        : null,
    nodeType: verified ? item.tipo_nodo : null,
    nodeText: verified ? item.texto_nodo : null,
    answerLabel: Array.isArray(label) ? Object.freeze([...label]) : label,
  });
}

export function interpretSessionTrace(data, { sessionId, code }) {
  if (!isPlainObject(data)) return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);

  const responseSession =
    typeof data.id_sesion === 'string' ? data.id_sesion.toLowerCase() : null;

  if (responseSession !== sessionId || data.id_participante !== code) {
    return failure(TRACE_QUERY_STATUS.MISMATCH);
  }

  if (!Array.isArray(data.registros)) {
    return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);
  }

  const records = data.registros.map(toRecord);
  const sequences = new Set(records.map((record) => record?.sequence));

  if (records.includes(null) || sequences.size !== records.length) {
    return failure(TRACE_QUERY_STATUS.INVALID_RESPONSE);
  }

  const ordered = [...records].sort((a, b) => a.sequence - b.sequence);

  return Object.freeze({
    ok: true,
    trace: Object.freeze({
      sessionId,
      code,
      records: Object.freeze(ordered),
    }),
  });
}
