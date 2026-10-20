import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { InstallAppButton } from './InstallAppButton.jsx';

const render = (modo) =>
  renderToStaticMarkup(<InstallAppButton modo={modo} onOpen={() => {}} />);

it('no se pinta si la app ya está instalada', () => {
  expect(render('instalada')).toBe('');
});

it('anuncia que abre un diálogo y oculta el ícono', () => {
  const html = render('instrucciones');

  expect(html).toContain('aria-haspopup="dialog"');
  expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  expect(html).toContain('Instalar Brisa');
});
