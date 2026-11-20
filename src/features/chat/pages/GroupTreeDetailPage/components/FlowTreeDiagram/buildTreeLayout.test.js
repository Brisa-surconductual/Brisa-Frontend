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
