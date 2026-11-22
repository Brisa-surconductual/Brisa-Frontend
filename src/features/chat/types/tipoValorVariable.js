import { TIPO_ENTRADA } from './tipoEntrada.js';

// RF-30B: forma del valor que mide una variable taxonómica (mismo enum que
// `chat.tipo_valor_variable_enum` del backend).
export const TIPO_VALOR_VARIABLE = Object.freeze({
  ENTERO: 'ENTERO',
  CATEGORIA: 'CATEGORIA',
  BOOLEANO: 'BOOLEANO',
});

export const TIPO_VALOR_VARIABLE_ETIQUETA = Object.freeze({
  [TIPO_VALOR_VARIABLE.ENTERO]: 'Número entero',
  [TIPO_VALOR_VARIABLE.CATEGORIA]: 'Categorías',
  [TIPO_VALOR_VARIABLE.BOOLEANO]: 'Sí / No',
});

// Tipos de respuesta del nodo que puede admitir cada tipo de valor (la
// variable filtra el selector "Tipo de respuesta" del editor de nodos).
export const ENTRADAS_POR_TIPO_VALOR = Object.freeze({
  [TIPO_VALOR_VARIABLE.ENTERO]: Object.freeze([
    TIPO_ENTRADA.ESCALA,
    TIPO_ENTRADA.NUMERICO,
  ]),
  [TIPO_VALOR_VARIABLE.CATEGORIA]: Object.freeze([
    TIPO_ENTRADA.OPCION_UNICA,
    TIPO_ENTRADA.MULTISELECCION,
  ]),
  [TIPO_VALOR_VARIABLE.BOOLEANO]: Object.freeze([TIPO_ENTRADA.BOOLEANO]),
});
