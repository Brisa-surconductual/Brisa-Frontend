import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { EMISOR, TIPO_NODO } from '../../types/index.js';
import { ChatThread } from './ChatThread.jsx';

const nodo = (id, contenido, tipo_nodo = TIPO_NODO.MENSAJE) => ({
  tipo: 'nodo',
  id,
  nodo: { id_nodo: id, tipo_nodo, contenido },
});

const render = (items) => renderToStaticMarkup(<ChatThread items={items} />);

it('pinta los items en el orden recibido', () => {
  const html = render([
    nodo('n1', { emisor: EMISOR.AVATAR, texto: 'Primero' }),
    { tipo: 'respuesta', id: 'r1', texto: 'Mi respuesta' },
    nodo('n2', { emisor: EMISOR.AVATAR, texto: 'Tercero' }),
  ]);

  expect(html.indexOf('Primero')).toBeLessThan(html.indexOf('Mi respuesta'));
  expect(html.indexOf('Mi respuesta')).toBeLessThan(html.indexOf('Tercero'));
  expect(html).toContain('Tú: </span>Mi respuesta');
});

it('no genera emojis', () => {
  const html = render([
    nodo('n1', { emisor: EMISOR.AVATAR, texto: 'Hola', instrucciones: 'Lee' }),
    nodo('n2', { emisor: EMISOR.SISTEMA, texto: 'Aviso' }),
    { tipo: 'respuesta', id: 'r1', texto: 'Sí' },
    nodo('n3', { titulo: 'Fin', texto: 'Bien' }, TIPO_NODO.RESUMEN),
  ]);

  expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
});
