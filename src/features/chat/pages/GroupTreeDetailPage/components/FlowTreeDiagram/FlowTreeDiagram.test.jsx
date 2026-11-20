import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { FlowTreeDiagram } from './FlowTreeDiagram.jsx';

const nodo = (id, extra = {}) => ({
  id,
  etiqueta: `${id}. Texto`,
  tipoNodo: 'MENSAJE',
  esNodoInicial: false,
  orden: null,
  ...extra,
});

describe('FlowTreeDiagram', () => {
  it('un flujo sin nodos lo dice', () => {
    const html = renderToStaticMarkup(
      <FlowTreeDiagram nodos={[]} transiciones={[]} />,
    );

    expect(html).toContain('Este flujo aún no tiene nodos');
  });

  it('muestra cada nodo con su etiqueta y marca el inicial', () => {
    const nodos = [nodo('1', { esNodoInicial: true })];
    const html = renderToStaticMarkup(
      <FlowTreeDiagram nodos={nodos} transiciones={[]} />,
    );

    expect(html).toContain('1. Texto');
    expect(html).toContain('Nodo inicial');
  });

  it('avisa cuando hay nodos sin conexión', () => {
    const nodos = [nodo('1', { esNodoInicial: true }), nodo('suelto')];
    const html = renderToStaticMarkup(
      <FlowTreeDiagram nodos={nodos} transiciones={[]} />,
    );

    expect(html).toContain('Sin conexión');
    expect(html).toContain('no tienen ninguna transición');
  });

  it('no avisa cuando todos los nodos están conectados', () => {
    const nodos = [nodo('1', { esNodoInicial: true }), nodo('2')];
    const transiciones = [{ id: 't1', origenId: '1', destinoId: '2' }];
    const html = renderToStaticMarkup(
      <FlowTreeDiagram nodos={nodos} transiciones={transiciones} />,
    );

    expect(html).not.toContain('no tienen ninguna transición');
  });

  it('cada caja es un botón accesible por su etiqueta', () => {
    const nodos = [nodo('1', { esNodoInicial: true })];
    const html = renderToStaticMarkup(
      <FlowTreeDiagram
        nodos={nodos}
        transiciones={[]}
        onSelectNodo={vi.fn()}
      />,
    );

    expect(html).toContain('aria-label="Ir al nodo 1. Texto"');
    expect(html).toMatch(/<button[^>]*>/);
  });
});
