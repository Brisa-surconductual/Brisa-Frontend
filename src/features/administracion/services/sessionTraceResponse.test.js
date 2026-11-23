import { describe, expect, it } from 'vitest';

import { TRACE_QUERY_STATUS as S } from '../types/chatTraceability.js';

import { interpretSessionTrace } from './sessionTraceResponse.js';

const CODE = 'P-1A2B3C4D';
const SESSION = '00000000-0000-4000-8000-000000000001';
const NODE_A = '00000000-0000-4000-8000-00000000000a';
const NODE_B = '00000000-0000-4000-8000-00000000000b';

const record = (changes = {}) => ({
  secuencia: 1,
  id_nodo: NODE_A,
  respuesta_usuario: { valor: 'si' },
  id_nodo_destino: NODE_B,
  timestamp_interaccion: '2026-11-20T14:00:00.000Z',
  tipo_entrada: 'OPCION_UNICA',
  contenido_historico: 'VERIFICADO',
  motivo_no_verificable: null,
  tipo_nodo: 'PREGUNTA',
  texto_nodo: '¿Dormiste bien?',
  etiqueta_respuesta: 'Sí, bien',
  ...changes,
});

const data = (registros = [record()], changes = {}) => ({
  id_sesion: SESSION,
  id_participante: CODE,
  registros,
  ...changes,
});

const interpret = (value) => interpretSessionTrace(value, { sessionId: SESSION, code: CODE });

describe('interpretSessionTrace (RF-38)', () => {
  it('proyecta un registro verificado con su texto exacto', () => {
    const { trace } = interpret(data());

    expect(trace.records[0]).toEqual({
      sequence: 1,
      nodeId: NODE_A,
      nextNodeId: NODE_B,
      at: '2026-11-20T14:00:00.000Z',
      inputType: 'OPCION_UNICA',
      value: 'si',
      verified: true,
      reason: null,
      nodeType: 'PREGUNTA',
      nodeText: '¿Dormiste bien?',
      answerLabel: 'Sí, bien',
    });
  });

  it('no verificable: descarta texto, tipo y etiqueta aunque lleguen', () => {
    const { trace } = interpret(
      data([
        record({
          contenido_historico: 'NO_VERIFICABLE',
          motivo_no_verificable: 'NODO_MODIFICADO_TRAS_PUBLICACION',
          texto_nodo: 'texto actual, no histórico',
          tipo_nodo: 'PREGUNTA',
          etiqueta_respuesta: 'Sí',
        }),
      ]),
    );

    expect(trace.records[0]).toMatchObject({
      verified: false,
      reason: 'NODO_MODIFICADO_TRAS_PUBLICACION',
      nodeText: null,
      nodeType: null,
      answerLabel: null,
      value: 'si',
    });
  });

  it('un valor desconocido de contenido_historico se trata como no verificable', () => {
    expect(interpret(data([record({ contenido_historico: 'OTRO' })])).trace.records[0].verified).toBe(false);
  });

  it('VERIFICADO con motivo no es verificable', () => {
    expect(
      interpret(data([record({ motivo_no_verificable: 'NODO_NO_DISPONIBLE' })])).trace.records[0].verified,
    ).toBe(false);
  });

  it('conserva valores numéricos, booleanos, textos, arreglos, objetos y null', () => {
    const values = [7, true, false, 'texto libre', ['a', 'b'], { hora: '08:00' }, null];
    const { trace } = interpret(
      data(values.map((valor, i) => record({ secuencia: i + 1, respuesta_usuario: { valor } }))),
    );

    expect(trace.records.map((r) => r.value)).toEqual(values);
  });

  it('etiquetas múltiples', () => {
    const { trace } = interpret(
      data([record({ tipo_entrada: 'MULTISELECCION', respuesta_usuario: { valor: ['a', 'b'] }, etiqueta_respuesta: ['A', 'B'] })]),
    );

    expect(trace.records[0].answerLabel).toEqual(['A', 'B']);
  });

  it('nodo final: id_nodo_destino null', () => {
    expect(interpret(data([record({ id_nodo_destino: null })])).trace.records[0].nextNodeId).toBeNull();
  });

  it('sin interacciones', () => {
    expect(interpret(data([])).trace.records).toEqual([]);
  });

  it('ordena por secuencia ascendente', () => {
    const { trace } = interpret(data([record({ secuencia: 3 }), record({ secuencia: 1 }), record({ secuencia: 2 })]));

    expect(trace.records.map((r) => r.sequence)).toEqual([1, 2, 3]);
  });

  it('acepta el id de sesión en mayúscula', () => {
    expect(interpret(data(undefined, { id_sesion: SESSION.toUpperCase() })).ok).toBe(true);
  });

  it.each([
    ['otro participante', data(undefined, { id_participante: 'P-FFFFFFFF' })],
    ['otra sesión', data(undefined, { id_sesion: '00000000-0000-4000-8000-000000000009' })],
  ])('%s: MISMATCH, sin registros', (_, value) => {
    expect(interpret(value)).toEqual({ ok: false, status: S.MISMATCH });
  });

  it.each([
    ['sin objeto', null],
    ['registros no es lista', data('x')],
    ['secuencia repetida', data([record(), record()])],
    ['secuencia no entera', data([record({ secuencia: 1.5 })])],
    ['sin respuesta_usuario', data([record({ respuesta_usuario: undefined })])],
    ['respuesta sin valor', data([record({ respuesta_usuario: {} })])],
    ['nodo no UUID', data([record({ id_nodo: 'x' })])],
    ['destino no UUID', data([record({ id_nodo_destino: 'fin' })])],
    ['sin tipo de entrada', data([record({ tipo_entrada: '' })])],
    ['texto verificado no textual', data([record({ texto_nodo: 5 })])],
    ['etiqueta con elementos no textuales', data([record({ etiqueta_respuesta: ['A', 1] })])],
  ])('%s: INVALID_RESPONSE', (_, value) => {
    expect(interpret(value)).toEqual({ ok: false, status: S.INVALID_RESPONSE });
  });
});
