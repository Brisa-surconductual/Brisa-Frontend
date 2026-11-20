import { describe, expect, it } from 'vitest';

import {
  anteponerSinDuplicar,
  mapHistorial,
} from './historialInteracciones.js';

const textoDe = (entrada, _tipo, valor) =>
  entrada.opciones?.find((o) => o.valor === valor)?.etiqueta ?? null;

const interaccion = (secuencia, nodo, respuesta) => ({
  id_interaccion: `i${secuencia}`,
  secuencia,
  timestamp_interaccion: '2026-11-20T10:00:00.000Z',
  registrada_en: '2026-11-20T10:00:00.000Z',
  nodo,
  respuesta,
});

const pregunta = {
  idNodo: 'n2',
  bloques: [
    { orden: 2, tipo: 'IMAGEN', idRecurso: 'r1', url: 'https://x/a.png' },
    { orden: 1, tipo: 'TEXTO', texto: '  ¿Cómo estás?\n' },
  ],
  entrada: {
    tipo: 'OPCION_UNICA',
    obligatorio: true,
    opciones: [{ valor: 'BIEN', etiqueta: 'Bien' }],
  },
};

const informativo = {
  idNodo: 'n1',
  bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Hola' }],
  entrada: null,
};

const pagina = {
  id_sesion: 's',
  ultima_secuencia: 7,
  hay_mas: true,
  interacciones: [
    interaccion(6, informativo, { tipo_entrada: 'CONTINUAR', valor: null }),
    interaccion(7, pregunta, { tipo_entrada: 'OPCION_UNICA', valor: 'BIEN' }),
  ],
};

describe('mapHistorial (RF-32)', () => {
  it('arma nodo y respuesta en orden, con la etiqueta de la opción (CA-32-3)', () => {
    const r = mapHistorial(pagina, textoDe);

    expect(r.ultimaSecuencia).toBe(7);
    expect(r.hayMas).toBe(true);
    expect(r.secuenciaMinima).toBe(6);
    expect(r.items.map((i) => i.id)).toEqual([
      'historial-i6-nodo',
      'historial-i7-nodo',
      'historial-i7-respuesta',
    ]);
    expect(r.items[2]).toEqual({
      tipo: 'respuesta',
      id: 'historial-i7-respuesta',
      texto: 'Bien',
    });
  });

  it('CONTINUAR no agrega burbuja (CA-32-4)', () => {
    const r = mapHistorial(pagina, textoDe);
    const delInformativo = r.items.filter((i) =>
      i.id.startsWith('historial-i6'),
    );

    expect(delInformativo).toHaveLength(1);
  });

  it('ordena los bloques sin modificar su texto y conserva idRecurso (RF-26, RF-33)', () => {
    const { nodo } = mapHistorial(pagina, textoDe).items[1];

    expect(nodo.bloques.map((b) => b.tipo)).toEqual(['TEXTO', 'IMAGEN']);
    expect(nodo.bloques[0].texto).toBe('  ¿Cómo estás?\n');
    expect(nodo.bloques[1].idRecurso).toBe('r1');
  });

  it('sin etiqueta conocida muestra el valor tal cual', () => {
    const r = mapHistorial(
      {
        ...pagina,
        interacciones: [
          interaccion(
            7,
            { ...pregunta, entrada: { tipo: 'ESCALA' } },
            { tipo_entrada: 'ESCALA', valor: 7 },
          ),
        ],
      },
      () => null,
    );

    expect(r.items.at(-1).texto).toBe('7');
  });

  it('una sesión sin interacciones no da items', () => {
    expect(
      mapHistorial(
        { ultima_secuencia: 0, hay_mas: false, interacciones: [] },
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
