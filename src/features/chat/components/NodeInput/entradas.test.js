import { describe, expect, it } from 'vitest';

import { TIPO_ENTRADA } from '../../types/index.js';
import { resolverRespuesta } from '../NodeInputForm/resolverRespuesta.js';
import { opcionesBooleano } from './booleano.js';
import { alternarSeleccion, textoAyuda } from './multiseleccion.js';
import { ayudaNumerico, modoTeclado, numerico } from './numerico.js';
import { REGISTRO_ENTRADAS } from './registroEntradas.js';

const { OPCION_UNICA, MULTISELECCION, BOOLEANO, ESCALA, NUMERICO } =
  TIPO_ENTRADA;

const opciones = [
  { valor: 'si', etiqueta: 'Sí, claro' },
  { valor: 'no', etiqueta: 'No' },
];

describe('registro', () => {
  it('tiene los 5 tipos de esta parte, con claves de TIPO_ENTRADA', () => {
    expect(Object.keys(REGISTRO_ENTRADAS).sort()).toEqual(
      [BOOLEANO, ESCALA, NUMERICO, MULTISELECCION, OPCION_UNICA].sort(),
    );
  });

  it.each(Object.entries(REGISTRO_ENTRADAS))('%s sin validar', (_t, e) => {
    expect(e.Componente).toBeTypeOf('function');
    expect(e.textoRespuesta).toBeTypeOf('function');
    expect(e).not.toHaveProperty('validar');
  });
});

describe('textoRespuesta usa la etiqueta, no el valor', () => {
  it.each([
    [OPCION_UNICA, { opciones }, 'si', 'Sí, claro'],
    [MULTISELECCION, { opciones }, ['no', 'si'], 'Sí, claro, No'],
    [BOOLEANO, { opciones: null }, false, 'No'],
    [
      BOOLEANO,
      {
        opciones: [
          { valor: true, etiqueta: 'Ya lo hice' },
          { valor: false, etiqueta: 'Todavía no' },
        ],
      },
      false,
      'Todavía no',
    ],
    [ESCALA, { max: 10 }, 7, '7/10'],
    [ESCALA, { max: 5 }, 2.5, '2,5/5'],
    [ESCALA, { max: null }, 3, '3'],
    [NUMERICO, {}, 3.5, '3,5'],
  ])('%s con %j', (tipo, entrada, valor, texto) => {
    expect(REGISTRO_ENTRADAS[tipo].textoRespuesta(entrada, valor)).toBe(texto);
  });
});

it('booleano sin opciones usa «Sí» y «No» (D5)', () => {
  expect(opcionesBooleano({ opciones: null }).map((o) => o.etiqueta)).toEqual([
    'Sí',
    'No',
  ]);
  expect(opcionesBooleano({ opciones })).toBe(opciones);
});

it('alternarSeleccion agrega y quita sin repetidos (CA-27-5)', () => {
  expect(alternarSeleccion([], 'a')).toEqual(['a']);
  expect(alternarSeleccion(['a', 'b'], 'a')).toEqual(['b']);
  expect(alternarSeleccion(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
});

it('textoAyuda solo con min y max (D5)', () => {
  expect(textoAyuda(1, 3)).toBe('Elige entre 1 y 3 opciones');
  expect(textoAyuda(2, null)).toBeNull();
  expect(textoAyuda()).toBeNull();
});

describe('numerico.normalizar (D2)', () => {
  it.each([
    ['12', 12],
    ['7,5', 7.5],
    [' 7 ', 7],
    ['-2', -2],
    ['', null],
    ['   ', null],
    [null, null],
  ])('%j → %j', (texto, numero) => {
    expect(numerico.normalizar({}, texto)).toBe(numero);
  });

  it('150 con max 100 se envía como 150 (CA-28-6)', () => {
    expect(numerico.normalizar({ max: 100 }, '150')).toBe(150);
  });

  it.each(['1.000', '3.5', '1e3', '12abc', '9'.repeat(400)])(
    '%j no se puede convertir y viaja tal cual',
    (texto) => {
      expect(numerico.normalizar({}, texto)).toBe(texto);
    },
  );
});

it('ayudaNumerico y modoTeclado leen la configuración', () => {
  expect(ayudaNumerico({ min: 0, max: 50, paso: 1 })).toBe('Entre 0 y 50');
  expect(ayudaNumerico({ min: 0, paso: 0.5 })).toBe(
    'Mínimo 0. Usa coma para los decimales',
  );
  expect(ayudaNumerico({ max: 5 })).toBe('Máximo 5');
  expect(ayudaNumerico({})).toBeNull();
  expect(modoTeclado({ paso: 1 })).toBe('numeric');
  expect(modoTeclado({ paso: null })).toBe('decimal');
});

describe('resolverRespuesta', () => {
  it('convierte con `normalizar` y arma el texto', () => {
    expect(resolverRespuesta({}, REGISTRO_ENTRADAS[NUMERICO], '7,5')).toEqual({
      valor: 7.5,
      textoRespuesta: '7,5',
    });
  });

  it.each([null, '', '  ', []])('%j viaja como null (D2)', (vacia) => {
    expect(
      resolverRespuesta({ opciones }, REGISTRO_ENTRADAS[MULTISELECCION], vacia),
    ).toEqual({ valor: null, textoRespuesta: null });
  });

  it('una escala sin tocar no tiene valor por defecto (A-034)', () => {
    expect(
      resolverRespuesta(
        { min: 0, max: 10, paso: 1 },
        REGISTRO_ENTRADAS[ESCALA],
        null,
      ).valor,
    ).toBeNull();
  });
});
