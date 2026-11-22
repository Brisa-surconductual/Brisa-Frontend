import { describe, expect, it } from 'vitest';

import { buildTreeLayout } from './buildTreeLayout.js';

const nodo = (id, extra = {}) => ({
  id,
  etiqueta: id,
  esNodoInicial: false,
  orden: null,
  ...extra,
});

const transicion = (id, origenId, destinoId) => ({ id, origenId, destinoId });

describe('buildTreeLayout', () => {
  it('un árbol vacío no produce cajas ni aristas', () => {
    const layout = buildTreeLayout([], []);

    expect(layout.cajas).toEqual([]);
    expect(layout.aristas).toEqual([]);
    expect(layout.ancho).toBe(0);
    expect(layout.alto).toBe(0);
  });

  it('ubica el nodo inicial en la fila 0 y sus hijos por nivel de alcance', () => {
    const nodos = [nodo('a', { esNodoInicial: true }), nodo('b'), nodo('c')];
    const transiciones = [
      transicion('t1', 'a', 'b'),
      transicion('t2', 'b', 'c'),
    ];

    const layout = buildTreeLayout(nodos, transiciones);
    const filaDe = (id) => layout.cajas.find((c) => c.nodo.id === id).fila;

    expect(filaDe('a')).toBe(0);
    expect(filaDe('b')).toBe(1);
    expect(filaDe('c')).toBe(2);
    expect(layout.cajas.every((c) => !c.huerfano)).toBe(true);
  });

  it('dos transiciones desde el mismo origen ramifican en la misma fila', () => {
    const nodos = [nodo('a', { esNodoInicial: true }), nodo('b'), nodo('c')];
    const transiciones = [
      transicion('t1', 'a', 'b'),
      transicion('t2', 'a', 'c'),
    ];

    const layout = buildTreeLayout(nodos, transiciones);
    const filaDe = (id) => layout.cajas.find((c) => c.nodo.id === id).fila;
    const columnaDe = (id) =>
      layout.cajas.find((c) => c.nodo.id === id).columna;

    expect(filaDe('b')).toBe(1);
    expect(filaDe('c')).toBe(1);
    expect(columnaDe('b')).not.toBe(columnaDe('c'));
  });

  it('un nodo sin transición entrante queda marcado como huérfano', () => {
    const nodos = [nodo('a', { esNodoInicial: true }), nodo('suelto')];
    const layout = buildTreeLayout(nodos, []);

    const suelto = layout.cajas.find((c) => c.nodo.id === 'suelto');
    expect(suelto.huerfano).toBe(true);
    expect(layout.hayHuerfanos).toBe(true);
  });

  it('sin nodo inicial, todos los nodos quedan huérfanos', () => {
    const nodos = [nodo('a'), nodo('b')];
    const layout = buildTreeLayout(nodos, [transicion('t1', 'a', 'b')]);

    expect(layout.cajas.every((c) => c.huerfano)).toBe(true);
  });

  it('calcula coordenadas de arista desde el borde inferior del origen al superior del destino', () => {
    const nodos = [nodo('a', { esNodoInicial: true }), nodo('b')];
    const layout = buildTreeLayout(nodos, [transicion('t1', 'a', 'b')]);

    const origen = layout.cajas.find((c) => c.nodo.id === 'a');
    const destino = layout.cajas.find((c) => c.nodo.id === 'b');
    const [arista] = layout.aristas;

    expect(arista.y1).toBe(origen.y + 68);
    expect(arista.y2).toBe(destino.y);
    expect(arista.x1).toBeGreaterThan(0);
  });

  it('ignora transiciones que referencian nodos fuera del árbol', () => {
    const nodos = [nodo('a', { esNodoInicial: true })];
    const layout = buildTreeLayout(nodos, [transicion('t1', 'a', 'no-existe')]);

    expect(layout.aristas).toEqual([]);
  });
});

describe('buildTreeLayout · flujo del árbol (RF-25)', () => {
  const nodoRF25 = (id, extra = {}) => ({
    id,
    etiqueta: id,
    esNodoInicial: false,
    esNodoFinal: false,
    orden: null,
    entrada: { tipo: 'BOOLEANO' },
    ...extra,
  });
  const rama = (id, origenId, destinoId, extra = {}) => ({
    id,
    origenId,
    destinoId,
    ordenEvaluacion: 1,
    regla: null,
    ...extra,
  });

  it('centra al padre sobre sus hijos y deja el nodo final abajo', () => {
    const nodos = [
      nodoRF25('a', { esNodoInicial: true }),
      nodoRF25('b'),
      nodoRF25('c'),
      nodoRF25('f', { esNodoFinal: true, entrada: null }),
    ];
    const layout = buildTreeLayout(nodos, [
      rama('t1', 'a', 'b'),
      rama('t2', 'a', 'c', { ordenEvaluacion: 2 }),
      rama('t3', 'b', 'f'),
      rama('t4', 'c', 'f'),
    ]);
    const caja = (id) => layout.cajas.find((c) => c.nodo.id === id);

    expect(caja('a').x).toBe((caja('b').x + caja('c').x) / 2);
    expect(caja('f').fila).toBeGreaterThan(caja('b').fila);
    expect(caja('f').x).toBe(caja('a').x);
  });

  it('dibuja ramas curvas con su tipo y etiqueta', () => {
    const nodos = [
      nodoRF25('a', { esNodoInicial: true, orden: 1, entrada: null }),
      nodoRF25('b', { orden: 2, entrada: null }),
      nodoRF25('f', { orden: 3, esNodoFinal: true, entrada: null }),
    ];
    const layout = buildTreeLayout(nodos, [
      rama('t1', 'b', 'f', {
        esPorDefecto: true,
        regla: { operador: 'SIEMPRE', valorEsperado: {} },
      }),
    ]);
    const porId = new Map(layout.aristas.map((a) => [a.id, a]));

    expect(porId.get('implicita-a')).toMatchObject({
      tipo: 'IMPLICITA',
      etiqueta: 'Automática',
    });
    expect(porId.get('t1')).toMatchObject({
      tipo: 'POR_DEFECTO',
      etiqueta: 'Otra respuesta',
    });
    expect(porId.get('t1').d).toMatch(/^M .* C /);
    expect(layout.cajas.every((c) => !c.huerfano)).toBe(true);
  });
});
