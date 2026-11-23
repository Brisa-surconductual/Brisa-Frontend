import { INPUT_TYPE } from '../types/chatTraceability.js';

/*
 * Presentación del valor registrado (`respuesta_usuario.valor`) sin
 * perder información: se muestra el valor tal cual, como texto (nunca
 * como HTML). La etiqueta de la opción es una explicación adicional y
 * nunca sustituye al valor.
 */
export const ANSWER_KIND = Object.freeze({
  CONTINUE: 'CONTINUE',
  NULL: 'NULL',
  TEXT: 'TEXT',
  EMPTY_TEXT: 'EMPTY_TEXT',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  LIST: 'LIST',
  OBJECT: 'OBJECT',
});

// Elemento de un arreglo: los textos tal cual; lo demás como JSON.
const listItem = (value) =>
  typeof value === 'string' ? value : JSON.stringify(value);

export function describeTraceAnswer({ inputType, value }) {
  if (value === null) {
    return Object.freeze({
      kind: inputType === INPUT_TYPE.CONTINUAR ? ANSWER_KIND.CONTINUE : ANSWER_KIND.NULL,
      text: 'null',
    });
  }

  if (typeof value === 'string') {
    return Object.freeze({
      kind: value === '' ? ANSWER_KIND.EMPTY_TEXT : ANSWER_KIND.TEXT,
      text: value,
    });
  }

  if (typeof value === 'number') {
    return Object.freeze({ kind: ANSWER_KIND.NUMBER, text: String(value) });
  }

  if (typeof value === 'boolean') {
    return Object.freeze({ kind: ANSWER_KIND.BOOLEAN, text: String(value) });
  }

  if (Array.isArray(value)) {
    return Object.freeze({
      kind: ANSWER_KIND.LIST,
      text: JSON.stringify(value),
      items: Object.freeze(value.map(listItem)),
    });
  }

  return Object.freeze({
    kind: ANSWER_KIND.OBJECT,
    text: JSON.stringify(value, null, 2),
  });
}

// Etiquetas de la opción elegida: una, varias o ninguna.
export function answerLabels(label) {
  if (typeof label === 'string') return Object.freeze([label]);
  if (Array.isArray(label)) return Object.freeze([...label]);
  return Object.freeze([]);
}
