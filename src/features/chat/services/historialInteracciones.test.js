import { describe, expect, it } from 'vitest';

import {
  anteponerSinDuplicar,
  mapHistorial,
} from './historialInteracciones.js';

// Registro mínimo: OPCION_UNICA por etiqueta, ESCALA con su máximo y
// BOOLEANO con Sí/No (como el registro real sin configuración).
const textoDe = (entrada, tipo, valor) => {
  if (tipo === 'BOOLEANO') return valor ? 'Sí' : 'No';
  if (tipo === 'ESCALA')
    return entrada.max == null ? String(valor) : `${valor}/${entrada.max}`;
  return entrada.opciones?.find((o) => o.valor === valor)?.etiqueta ?? null;
};

// Forma del contrato RF-31/32 (`GET .../historial`).
const interaccion = (secuencia, nodo, respuesta) => ({
  id_interaccion: `i${secuencia}`,
  secuencia,
  timestamp_interaccion: '2026-11-20T10:00:00.000Z',
  nodo,
  respuesta,
  id_nodo_destino: 'destino',
});

const pregunta = {
  id_nodo: 'n2',
  tipo_nodo: 'PREGUNTA',
  bloques: [
    { orden: 2, tipo: 'IMAGEN', idRecurso: 'r1', url: 'https://x/a.png' },
    { orden: 1, tipo: 'TEXTO', texto: '  ¿Cómo estás?\n' },
  ],
};

const informativo = {
  id_nodo: 'n1',
  tipo_nodo: 'INFORMATIVO',
  bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Hola' }],
};

const pagina = {
  items: [
    interaccion(20, informativo, {
      tipo_entrada: 'CONTINUAR',
      valor: null,
      etiqueta: null,
    }),
    interaccion(21, pregunta, {
      tipo_entrada: 'OPCION_UNICA',
      valor: 'BIEN',
      etiqueta: 'Bien',
    }),
  ],
  hay_mas: true,
  siguiente_cursor: 20,
};

const respuestaDe = (respuesta) =>
  mapHistorial(
    {
      items: [interaccion(5, pregunta, respuesta)],
      hay_mas: false,
      siguiente_cursor: null,
    },
    textoDe,
  ).items.at(-1).texto;

describe('mapHistorial (RF-31 / RF-32)', () => {
  it('arma nodo y respuesta en orden, con la etiqueta del backend (CA-32-3)', () => {
    const r = mapHistorial(pagina, textoDe);

    expect(r.ultimaSecuencia).toBe(21);
    expect(r.hayMas).toBe(true);
    expect(r.secuenciaMinima).toBe(20);
    expect(r.items.map((i) => i.id)).toEqual([
      'historial-i20-nodo',
      'historial-i21-nodo',
      'historial-i21-respuesta',
    ]);
    expect(r.items[2]).toEqual({
      tipo: 'respuesta',
      id: 'historial-i21-respuesta',
      texto: 'Bien',
    });
  });

  it('lee id_nodo y tipo_nodo del contrato', () => {
    const { nodo } = mapHistorial(pagina, textoDe).items[1];

    expect(nodo).toMatchObject({
      idNodo: 'n2',
      tipoNodo: 'PREGUNTA',
      entrada: null,
    });
  });

  it('CONTINUAR no agrega burbuja (CA-32-4)', () => {
    const r = mapHistorial(pagina, textoDe);

    expect(
      r.items.filter((i) => i.id.startsWith('historial-i20')),
    ).toHaveLength(1);
  });

  it('ordena los bloques sin modificar su texto y conserva idRecurso (RF-26, RF-33)', () => {
    const { nodo } = mapHistorial(pagina, textoDe).items[1];

    expect(nodo.bloques.map((b) => b.tipo)).toEqual(['TEXTO', 'IMAGEN']);
    expect(nodo.bloques[0].texto).toBe('  ¿Cómo estás?\n');
    expect(nodo.bloques[1].idRecurso).toBe('r1');
  });

  it.each([
    [
      'sin etiqueta, con el registro',
      { tipo_entrada: 'BOOLEANO', valor: false, etiqueta: null },
      'No',
    ],
    [
      'escala sin máximo conocido',
      { tipo_entrada: 'ESCALA', valor: 7, etiqueta: null },
      '7',
    ],
    [
      'multiselección sin opciones: los valores',
      { tipo_entrada: 'MULTISELECCION', valor: ['A', 'B'], etiqueta: null },
      'A, B',
    ],
    [
      'sin texto del registro: el valor tal cual',
      { tipo_entrada: 'TEXTO_LIBRE', valor: 'hola', etiqueta: null },
      'hola',
    ],
  ])('%s', (_caso, respuesta, texto) => {
    expect(respuestaDe(respuesta)).toBe(texto);
  });

  it('el cursor es siguiente_cursor; sin él, la secuencia más baja', () => {
    expect(
      mapHistorial({ ...pagina, siguiente_cursor: null }, textoDe)
        .secuenciaMinima,
    ).toBe(20);
    expect(
      mapHistorial({ ...pagina, siguiente_cursor: 18 }, textoDe)
        .secuenciaMinima,
    ).toBe(18);
  });

  it('una página vacía no da items y la secuencia parte de 0', () => {
    expect(
      mapHistorial(
        { items: [], hay_mas: false, siguiente_cursor: null },
        textoDe,
      ),
    ).toEqual({
      ultimaSecuencia: 0,
      hayMas: false,
      secuenciaMinima: null,
      items: [],
    });
  });
});

describe('anteponerSinDuplicar (CA-32-2)', () => {
  it('agrega al principio y descarta lo que ya estaba', () => {
    const actuales = [{ id: 'b' }, { id: 'c' }];
    const anteriores = [{ id: 'a' }, { id: 'b' }];

    expect(anteponerSinDuplicar(anteriores, actuales).map((i) => i.id)).toEqual(
      ['a', 'b', 'c'],
    );
  });
});
