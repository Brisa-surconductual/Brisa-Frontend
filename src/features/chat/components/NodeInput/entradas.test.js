import { describe, expect, it } from 'vitest';

import { TIPO_ENTRADA } from '../../types/index.js';
import { resolverRespuesta } from '../NodeInputForm/resolverRespuesta.js';
import { ayudaNumerico, numerico } from './numerico.js';
import { REGISTRO_ENTRADAS } from './registroEntradas.js';
import { alternarSeleccion, textoAyuda } from './seleccionMultiple.js';

const { SELECCION_UNICA, SELECCION_MULTIPLE, BOOLEANO, ESCALA, NUMERICO } =
  TIPO_ENTRADA;

const opciones = [
  { valor: 'si', etiqueta: 'Sí, claro' },
  { valor: 'no', etiqueta: 'No' },
];
const multiple = { opciones, min_selecciones: 1, max_selecciones: 1 };
const escala = { min: 0, max: 10, paso: 1 };
const medios = { min: 0, max: 5, paso: 0.5 };
const num = { min: 0, max: 50, decimales: 1 };
const booleano = { etiqueta_verdadero: 'Sí', etiqueta_falso: 'Todavía no' };

describe('registro', () => {
  it.each(Object.entries(REGISTRO_ENTRADAS))('%s', (tipo, entrada) => {
    expect(Object.values(TIPO_ENTRADA)).toContain(tipo);
    expect(entrada.Componente).toBeTypeOf('function');
    expect(entrada.validar).toBeTypeOf('function');
    expect(entrada.textoRespuesta).toBeTypeOf('function');
  });
});

describe('validar', () => {
  it.each([
    [SELECCION_UNICA, { opciones }, 'si', null],
    [SELECCION_UNICA, { opciones }, 'tal vez', 'OPCION_NO_VALIDA'],
    [SELECCION_MULTIPLE, multiple, ['no'], null],
    [SELECCION_MULTIPLE, multiple, ['otra'], 'OPCION_NO_VALIDA'],
    [SELECCION_MULTIPLE, { opciones }, ['si', 'si'], 'OPCION_NO_VALIDA'],
    [
      SELECCION_MULTIPLE,
      { ...multiple, min_selecciones: 2 },
      ['si'],
      'FUERA_DE_RANGO',
    ],
    [SELECCION_MULTIPLE, multiple, ['si', 'no'], 'FUERA_DE_RANGO'],
    [ESCALA, escala, 7, null],
    [ESCALA, escala, 11, 'FUERA_DE_RANGO'],
    [ESCALA, escala, -1, 'FUERA_DE_RANGO'],
    [ESCALA, escala, 7.5, 'FORMATO_INVALIDO'],
    [ESCALA, escala, '7', 'TIPO_DATO_INVALIDO'],
    [ESCALA, escala, NaN, 'TIPO_DATO_INVALIDO'],
    [ESCALA, medios, 2.5, null],
    [ESCALA, medios, 2.25, 'FORMATO_INVALIDO'],
    [ESCALA, { min: 0, max: 1, paso: 0.1 }, 0.1 + 0.2, null],
    [NUMERICO, num, 3.5, null],
    [NUMERICO, num, 3.55, 'FORMATO_INVALIDO'],
    [NUMERICO, num, 51, 'FUERA_DE_RANGO'],
    [NUMERICO, { decimales: 0 }, 2.5, 'FORMATO_INVALIDO'],
    [NUMERICO, { decimales: 0 }, -2, null],
    [NUMERICO, { decimales: 2 }, 1e-7, 'FORMATO_INVALIDO'],
    [BOOLEANO, booleano, false, null],
    [BOOLEANO, booleano, 'false', 'TIPO_DATO_INVALIDO'],
  ])('%s con %j → %s', (tipo, entrada, respuesta, codigo) => {
    expect(REGISTRO_ENTRADAS[tipo].validar(entrada, respuesta)).toBe(codigo);
  });
});

describe('textoRespuesta usa la etiqueta, no el valor', () => {
  it.each([
    [SELECCION_UNICA, { opciones }, 'si', 'Sí, claro'],
    [SELECCION_MULTIPLE, { opciones }, ['no', 'si'], 'Sí, claro, No'],
    [BOOLEANO, booleano, false, 'Todavía no'],
  ])('%s', (tipo, entrada, respuesta, texto) => {
    expect(REGISTRO_ENTRADAS[tipo].textoRespuesta(entrada, respuesta)).toBe(
      texto,
    );
  });
});

it('alternarSeleccion agrega, quita y respeta el máximo', () => {
  expect(alternarSeleccion([], 'a', 2)).toEqual(['a']);
  expect(alternarSeleccion(['a', 'b'], 'a', 2)).toEqual(['b']);
  expect(alternarSeleccion(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
  expect(alternarSeleccion(['a', 'b'], 'c', undefined)).toEqual([
    'a',
    'b',
    'c',
  ]);
});

it('textoAyuda se arma desde la configuración', () => {
  expect(textoAyuda(3, 5)).toBe('Elige entre 3 y 5');
  expect(textoAyuda(2, null)).toBe('Elige al menos 2');
  expect(textoAyuda(undefined, 4)).toBe('Elige hasta 4');
  expect(textoAyuda()).toBeNull();
});

it.each([
  [ESCALA, escala, 7, '7/10'],
  [ESCALA, medios, 2.5, '2,5/5'],
  [NUMERICO, { unidad: 'horas' }, 3.5, '3,5 horas'],
  [NUMERICO, {}, 3.5, '3,5'],
])('textoRespuesta de %s', (tipo, entrada, respuesta, texto) => {
  expect(REGISTRO_ENTRADAS[tipo].textoRespuesta(entrada, respuesta)).toBe(
    texto,
  );
});

it('una escala obligatoria sin tocar no tiene valor por defecto', () => {
  expect(
    resolverRespuesta(
      { obligatorio: true, ...escala },
      REGISTRO_ENTRADAS[ESCALA],
      null,
    ),
  ).toMatchObject({ valido: false, codigo: 'RESPUESTA_OBLIGATORIA' });
});

describe('numerico.normalizar', () => {
  const entero = { decimales: 0 };
  const decimal = { decimales: 1 };

  it.each([
    [entero, '12', 12],
    [decimal, '3,5', 3.5],
    [entero, ' 7 ', 7],
    [entero, '-2', -2],
    [entero, '', null],
    [entero, '   ', null],
    [entero, null, null],
  ])('%j: %j → %j', (entrada, texto, numero) => {
    expect(numerico.normalizar(entrada, texto)).toBe(numero);
  });

  it.each([
    [entero, '1.000'],
    [entero, '1,000'],
    [decimal, '3.5'],
    [decimal, '1e3'],
    [decimal, '12abc'],
    [decimal, '1.000,5'],
    [decimal, '.'],
  ])('%j: %j no es un número válido', (entrada, texto) => {
    const valor = numerico.normalizar(entrada, texto);
    expect(numerico.validar(entrada, valor)).toBe('TIPO_DATO_INVALIDO');
  });
});

it('ayudaNumerico combina rango y separador decimal', () => {
  expect(ayudaNumerico({ min: 0, max: 50, decimales: 0 })).toBe('Entre 0 y 50');
  expect(ayudaNumerico({ min: 0, decimales: 1 })).toBe(
    'Mínimo 0. Usa coma para los decimales',
  );
  expect(ayudaNumerico({ max: 5 })).toBe('Máximo 5');
  expect(ayudaNumerico({})).toBeNull();
});

it('el registro tiene los 5 tipos de esta parte', () => {
  expect(Object.keys(REGISTRO_ENTRADAS).sort()).toEqual(
    [BOOLEANO, ESCALA, NUMERICO, SELECCION_MULTIPLE, SELECCION_UNICA].sort(),
  );
});
