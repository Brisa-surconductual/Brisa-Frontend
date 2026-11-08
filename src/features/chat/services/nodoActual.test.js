import { describe, expect, it } from 'vitest';

import { esIdSesionValido, mapNodoActual } from './nodoActual.js';

const respuesta = (bloques) => ({
  idSesion: 's1',
  estadoSesion: 'ACTIVA',
  perfil: { tipo_dependencia: 'X' },
  nodo: {
    idNodo: 'n1',
    tipoNodo: 'PREGUNTA',
    orden: 3,
    esTerminal: false,
    bloques,
    entrada: null,
    id_usuario: 'u1',
  },
});

describe('mapNodoActual (RF-26)', () => {
  it('ordena por `orden` sin mutar el original (CA-26-2)', () => {
    const bloques = [
      { orden: 2, tipo: 'INSTRUCCION', texto: 'b' },
      { orden: 1, tipo: 'TEXTO', texto: 'a' },
      { orden: 3, tipo: 'TEXTO', texto: 'c' },
    ];
    const copia = structuredClone(bloques);

    const { nodo } = mapNodoActual(respuesta(bloques));

    expect(nodo.bloques.map((b) => b.orden)).toEqual([1, 2, 3]);
    expect(bloques).toEqual(copia);
  });

  it('deja al final los bloques sin orden, en su orden de llegada (D14)', () => {
    const { nodo } = mapNodoActual(
      respuesta([
        { orden: null, texto: 'x' },
        { orden: 2, texto: 'b' },
        { orden: null, texto: 'y' },
        { orden: 1, texto: 'a' },
      ]),
    );

    expect(nodo.bloques.map((b) => b.texto)).toEqual(['a', 'b', 'x', 'y']);
  });

  it('descarta bloques que no son objetos', () => {
    const { nodo } = mapNodoActual(
      respuesta([null, 'x', { orden: 1, tipo: 'TEXTO', texto: 'a' }]),
    );

    expect(nodo.bloques).toEqual([{ orden: 1, tipo: 'TEXTO', texto: 'a' }]);
  });

  it('devuelve un objeto congelado solo con las claves de la ficha', () => {
    const resultado = mapNodoActual(respuesta([]));

    expect(Object.isFrozen(resultado)).toBe(true);
    expect(Object.isFrozen(resultado.nodo)).toBe(true);
    expect(Object.keys(resultado).sort()).toEqual(
      ['estadoSesion', 'idSesion', 'nodo'].sort(),
    );
    expect(Object.keys(resultado.nodo).sort()).toEqual(
      [
        'bloques',
        'entrada',
        'esTerminal',
        'idNodo',
        'orden',
        'tipoNodo',
      ].sort(),
    );
  });
});

describe('mapNodoActual: entrada (A-014)', () => {
  const conEntrada = (entrada) => ({
    ...respuesta([]),
    nodo: { ...respuesta([]).nodo, entrada },
  });

  it.each([
    ['SELECCION_UNICA', 'OPCION_UNICA'],
    ['SELECCION_MULTIPLE', 'MULTISELECCION'],
    ['ESCALA', 'ESCALA'],
    ['FECHA_HORA', 'FECHA_HORA'],
    ['DESCONOCIDO', 'DESCONOCIDO'],
    ['constructor', 'constructor'],
  ])('%s queda como %s (CA-27-11)', (recibido, esperado) => {
    const { nodo } = mapNodoActual(conEntrada({ tipo: recibido }));

    expect(nodo.entrada.tipo).toBe(esperado);
  });

  it('min y max en texto numérico pasan a número (D4, A-041)', () => {
    const { nodo } = mapNodoActual(
      conEntrada({ tipo: 'ESCALA', min: '0', max: '10', paso: 1 }),
    );

    expect(nodo.entrada).toMatchObject({ min: 0, max: 10, paso: 1 });
  });

  it.each(['abc', '', '  ', null, undefined, '2026-11-08'])(
    'min %j no numérico queda en null',
    (min) => {
      expect(
        mapNodoActual(conEntrada({ tipo: 'NUMERICO', min })).nodo.entrada.min,
      ).toBeNull();
    },
  );

  it('solo deja las claves de D4', () => {
    const { nodo } = mapNodoActual(
      conEntrada({
        tipo: 'BOOLEANO',
        obligatorio: true,
        etiqueta_verdadero: 'Sí',
        mensaje_error: 'x',
        min_selecciones: 1,
      }),
    );

    expect(Object.keys(nodo.entrada).sort()).toEqual(
      [
        'etiquetas',
        'formato',
        'max',
        'maxCaracteres',
        'min',
        'obligatorio',
        'opciones',
        'paso',
        'tipo',
      ].sort(),
    );
    expect(nodo.entrada.opciones).toBeNull();
  });

  it('entrada null sigue null', () => {
    expect(mapNodoActual(conEntrada(null)).nodo.entrada).toBeNull();
  });
});

describe('esIdSesionValido (D13)', () => {
  it('acepta un UUID y rechaza lo demás', () => {
    expect(esIdSesionValido('26000000-0000-4000-8000-000000000001')).toBe(true);
    expect(esIdSesionValido('no-es-uuid')).toBe(false);
    expect(esIdSesionValido(undefined)).toBe(false);
  });
});
