import { describe, expect, it } from 'vitest';

import { ANSWER_KIND, answerLabels, describeTraceAnswer } from './traceAnswer.js';

const describe_ = (value, inputType = 'TEXTO_LIBRE') => describeTraceAnswer({ inputType, value });

describe('describeTraceAnswer (RF-27: valor sin modificar)', () => {
  it('CONTINUAR con null es una continuación, no una respuesta omitida', () => {
    expect(describe_(null, 'CONTINUAR').kind).toBe(ANSWER_KIND.CONTINUE);
  });

  it('null en otro tipo es un valor nulo', () => {
    expect(describe_(null, 'ESCALA')).toEqual({ kind: ANSWER_KIND.NULL, text: 'null' });
  });

  it.each([
    ['texto', 'Me sentí\nmejor', ANSWER_KIND.TEXT, 'Me sentí\nmejor'],
    ['texto vacío', '', ANSWER_KIND.EMPTY_TEXT, ''],
    ['número', 7.25, ANSWER_KIND.NUMBER, '7.25'],
    ['cero', 0, ANSWER_KIND.NUMBER, '0'],
    ['booleano', false, ANSWER_KIND.BOOLEAN, 'false'],
  ])('%s', (_, value, kind, text) => {
    expect(describe_(value)).toEqual({ kind, text });
  });

  it('arreglo: elementos sin pérdida', () => {
    expect(describe_(['a', 2, { x: 1 }])).toEqual({
      kind: ANSWER_KIND.LIST,
      text: '["a",2,{"x":1}]',
      items: ['a', '2', '{"x":1}'],
    });
  });

  it('objeto: JSON legible', () => {
    expect(describe_({ hora: '08:00' })).toEqual({ kind: ANSWER_KIND.OBJECT, text: '{\n  "hora": "08:00"\n}' });
  });
});

describe('answerLabels', () => {
  it('una, varias o ninguna', () => {
    expect(answerLabels('Sí')).toEqual(['Sí']);
    expect(answerLabels(['A', 'B'])).toEqual(['A', 'B']);
    expect(answerLabels(null)).toEqual([]);
  });
});
