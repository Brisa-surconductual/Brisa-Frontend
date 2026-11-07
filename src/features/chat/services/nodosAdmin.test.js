import { describe, expect, it } from 'vitest';

import {
  opcionesTipoNodo,
  payloadActualizarNodo,
  payloadCrearNodo,
  validarNodo,
  valoresDesdeNodo,
  VALORES_NODO_VACIOS,
} from './nodosAdmin.js';

const nodo = {
  id: 'n-1',
  idTipoNodo: 't-1',
  tipoNodo: 'MENSAJE',
  texto: 'Hola',
  contenido: { texto: 'Hola', otra: 'clave' },
  esNodoInicial: true,
  orden: 2,
};

describe('validarNodo', () => {
  it('exige tipo y texto', () => {
    expect(validarNodo(VALORES_NODO_VACIOS)).toEqual({
      idTipoNodo: 'Elige el tipo de nodo.',
      texto: 'Escribe el texto del nodo.',
    });
  });

  it('un texto de solo espacios no es válido', () => {
    expect(
      validarNodo({ ...VALORES_NODO_VACIOS, idTipoNodo: 't', texto: '   ' }),
    ).toHaveProperty('texto');
  });

  it('el orden es opcional, entero y desde 1', () => {
    const base = { ...VALORES_NODO_VACIOS, idTipoNodo: 't', texto: 'x' };

    expect(validarNodo({ ...base, orden: '' })).toEqual({});
    expect(validarNodo({ ...base, orden: '3' })).toEqual({});
    for (const malo of ['0', '-1', '1.5', 'a']) {
      expect(validarNodo({ ...base, orden: malo })).toHaveProperty('orden');
    }
  });
});

describe('payloads', () => {
  it('crear: contenido solo con texto y orden solo si se escribió', () => {
    const valores = {
      idTipoNodo: 't-1',
      texto: 'Hola',
      esNodoInicial: false,
      orden: '',
    };

    expect(payloadCrearNodo(valores)).toEqual({
      id_tipo_nodo: 't-1',
      contenido: { texto: 'Hola' },
      es_nodo_inicial: false,
    });
    expect(payloadCrearNodo({ ...valores, orden: '4' }).orden).toBe(4);
  });

  it('editar: solo viajan los campos que cambiaron', () => {
    const valores = { ...valoresDesdeNodo(nodo), esNodoInicial: false };

    expect(payloadActualizarNodo(nodo, valores)).toEqual({
      es_nodo_inicial: false,
    });
  });

  it('editar el texto conserva las demás claves de contenido', () => {
    const valores = { ...valoresDesdeNodo(nodo), texto: 'Nuevo' };

    expect(payloadActualizarNodo(nodo, valores)).toEqual({
      contenido: { texto: 'Nuevo', otra: 'clave' },
    });
  });

  it('borrar el orden envía null y sin cambios devuelve null', () => {
    expect(
      payloadActualizarNodo(nodo, { ...valoresDesdeNodo(nodo), orden: '' }),
    ).toEqual({
      orden: null,
    });
    expect(payloadActualizarNodo(nodo, valoresDesdeNodo(nodo))).toBeNull();
  });
});

describe('opcionesTipoNodo', () => {
  it('convierte el catálogo en opciones', () => {
    expect(
      opcionesTipoNodo([{ id_tipo_nodo: 'a', nombre: 'MENSAJE' }]),
    ).toEqual([{ value: 'a', label: 'MENSAJE' }]);
    expect(opcionesTipoNodo(undefined)).toEqual([]);
  });
});
