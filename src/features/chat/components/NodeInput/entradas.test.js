import { describe, expect, it } from 'vitest';

import { TIPO_ENTRADA } from '../../types/index.js';
import { REGISTRO_ENTRADAS } from './registroEntradas.js';
import { alternarSeleccion, textoAyuda } from './seleccionMultiple.js';

const { SELECCION_UNICA, SELECCION_MULTIPLE, BOOLEANO } = TIPO_ENTRADA;

const opciones = [
  { valor: 'si', etiqueta: 'Sí, claro' },
  { valor: 'no', etiqueta: 'No' },
];
const multiple = { opciones, min_selecciones: 1, max_selecciones: 1 };
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
