import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChatThread } from './ChatThread.jsx';

const nodo = (id, bloques) => ({
  tipo: 'nodo',
  id,
  nodo: { idNodo: id, bloques },
});

const texto = (t) => ({ orden: 1, tipo: 'TEXTO', texto: t });

const render = (items) => renderToStaticMarkup(<ChatThread items={items} />);

it('pinta los items en el orden recibido', () => {
  const html = render([
    nodo('n1', [texto('Primero')]),
    { tipo: 'respuesta', id: 'r1', texto: 'Mi respuesta' },
    nodo('n2', [texto('Tercero')]),
  ]);

  expect(html.indexOf('Primero')).toBeLessThan(html.indexOf('Mi respuesta'));
  expect(html.indexOf('Mi respuesta')).toBeLessThan(html.indexOf('Tercero'));
  expect(html).toContain('Tú: </span>Mi respuesta');
});

it('conserva role="log" y solo el último item es enfocable', () => {
  const html = render([
    nodo('n1', [texto('Primero')]),
    { tipo: 'respuesta', id: 'r1', texto: 'Mi respuesta' },
    { ...nodo('n2', [texto('Tercero')]), actual: true },
  ]);

  expect(html).toContain('role="log"');
  expect(html.match(/tabindex="-1"/g)).toHaveLength(1);
  expect(html.indexOf('tabindex="-1"')).toBeGreaterThan(
    html.indexOf('Mi respuesta'),
  );
});

it('no genera emojis', () => {
  const html = render([
    nodo('n1', [
      texto('Hola'),
      { orden: 2, tipo: 'INSTRUCCION', texto: 'Lee' },
    ]),
    { tipo: 'respuesta', id: 'r1', texto: 'Sí' },
    nodo('n2', [{ orden: 1, tipo: 'IMAGEN', url: null }]),
  ]);

  expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
});
