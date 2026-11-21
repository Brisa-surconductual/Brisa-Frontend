import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { HistorialConversacion } from './HistorialConversacion.jsx';

const items = [
  {
    tipo: 'nodo',
    id: 'historial-i1-nodo',
    nodo: {
      idNodo: 'n1',
      bloques: [{ tipo: 'TEXTO', texto: 'Mensaje ficticio' }],
      entrada: null,
    },
  },
  {
    tipo: 'respuesta',
    id: 'historial-i1-respuesta',
    texto: 'Respuesta ficticia',
  },
];

const render = (props = {}) =>
  renderToStaticMarkup(
    <HistorialConversacion
      items={items}
      hayMas={false}
      cargandoAnteriores={false}
      errorAnteriores={null}
      onCargarAnteriores={() => {}}
      ultimoRef={{ current: null }}
      {...props}
    />,
  );

describe('HistorialConversacion (RF-31)', () => {
  it('pinta el hilo en orden', () => {
    const html = render();

    expect(html).toContain('role="log"');
    expect(html.indexOf('Mensaje ficticio')).toBeLessThan(
      html.indexOf('Respuesta ficticia'),
    );
  });

  it('con más páginas ofrece el botón accesible además del desplazamiento', () => {
    const html = render({ hayMas: true });

    expect(html).toContain('Ver mensajes anteriores');
    expect(html).not.toContain('Inicio de la conversación');
  });

  it('mientras carga lo anuncia y el botón queda deshabilitado', () => {
    const html = render({ hayMas: true, cargandoAnteriores: true });

    expect(html).toContain('Cargando mensajes anteriores');
    expect(html).toContain('disabled=""');
  });

  it('un error de la página anterior se muestra sin perder el hilo', () => {
    const html = render({
      hayMas: true,
      errorAnteriores: {
        status: 422,
        codigo: 'HISTORIAL_INCONSISTENTE',
        mensaje: 'Error ficticio del backend.',
        reintentable: false,
      },
    });

    expect(html).toContain('Error ficticio del backend.');
    expect(html).toContain('Mensaje ficticio');
  });

  it('marca el inicio solo cuando ya no quedan páginas', () => {
    expect(render({ inicioAlcanzado: true })).toContain(
      'Inicio de la conversación',
    );
    expect(render({ inicioAlcanzado: false })).not.toContain(
      'Inicio de la conversación',
    );
    expect(render({ inicioAlcanzado: true, items: [] })).not.toContain(
      'Inicio de la conversación',
    );
  });
});
