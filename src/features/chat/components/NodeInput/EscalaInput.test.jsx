import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { EscalaInput } from './EscalaInput.jsx';

const render = (valor, entrada = { min: 0, max: 10, paso: 1 }) =>
  renderToStaticMarkup(
    <EscalaInput entrada={entrada} valor={valor} onCambiar={() => {}} />,
  );

it('sin valor muestra "Sin elegir" también para lectores de pantalla', () => {
  const html = render(null);
  expect(html).toContain('>Sin elegir<');
  expect(html).toContain('aria-valuetext="Sin elegir"');
});

it('con valor muestra el número', () => {
  const html = render(7);
  expect(html).toContain('aria-valuetext="7"');
  expect(html).toContain('>7<');
  expect(html).not.toContain('Sin elegir');
});

it('con más de 11 posiciones solo marca los extremos', () => {
  const html = render(null, { min: 0, max: 100, paso: 1 });
  expect(html).toContain('>100<');
  expect(html).not.toContain('>50<');
});
