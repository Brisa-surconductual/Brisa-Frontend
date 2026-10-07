import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { EMISOR, TIPO_NODO } from '../../types/index.js';
import { ChatNodeMessage } from './ChatNodeMessage.jsx';

const render = (nodo) => renderToStaticMarkup(<ChatNodeMessage nodo={nodo} />);

it('pinta el texto sin modificar y escapa el HTML', () => {
  const texto = 'Dijo “hola”\nOtra línea <b>hola</b>';
  const html = render({
    tipo_nodo: TIPO_NODO.MENSAJE,
    contenido: { emisor: EMISOR.AVATAR, texto },
  });

  expect(html).toContain('Dijo “hola”\nOtra línea &lt;b&gt;hola&lt;/b&gt;');
  expect(html).not.toContain('<b>');
});

it('un RESUMEN pinta su título y su texto', () => {
  const html = render({
    tipo_nodo: TIPO_NODO.RESUMEN,
    contenido: { emisor: EMISOR.AVATAR, titulo: 'Semana 1', texto: 'Bien' },
  });

  expect(html).toContain('Semana 1');
  expect(html).toContain('Bien');
});

it('un nodo no presentable no pinta nada', () => {
  expect(render({ tipo_nodo: TIPO_NODO.MENSAJE })).toBe('');
  expect(
    render({ tipo_nodo: TIPO_NODO.MENSAJE, contenido: { texto: '' } }),
  ).toBe('');
});
