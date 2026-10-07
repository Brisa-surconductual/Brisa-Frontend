import { describe, expect, it } from 'vitest';

import { TIPO_ENTRADA } from '../../types/index.js';
import { REGISTRO_ENTRADAS } from './registroEntradas.js';

const { SELECCION_UNICA, BOOLEANO } = TIPO_ENTRADA;

const opciones = [
  { valor: 'si', etiqueta: 'Sí, claro' },
  { valor: 'no', etiqueta: 'No' },
];
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
    [BOOLEANO, booleano, false, null],
    [BOOLEANO, booleano, 'false', 'TIPO_DATO_INVALIDO'],
  ])('%s con %j → %s', (tipo, entrada, respuesta, codigo) => {
    expect(REGISTRO_ENTRADAS[tipo].validar(entrada, respuesta)).toBe(codigo);
  });
});

describe('textoRespuesta usa la etiqueta, no el valor', () => {
  it.each([
    [SELECCION_UNICA, { opciones }, 'si', 'Sí, claro'],
    [BOOLEANO, booleano, false, 'Todavía no'],
  ])('%s', (tipo, entrada, respuesta, texto) => {
    expect(REGISTRO_ENTRADAS[tipo].textoRespuesta(entrada, respuesta)).toBe(
      texto,
    );
  });
});
