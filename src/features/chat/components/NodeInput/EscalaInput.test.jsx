import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { EscalaInput } from './EscalaInput.jsx';

const ENTRADA = {
  min: 0,
  max: 10,
  paso: 1,
  etiquetas: { min: 'Nada', max: 'Muchísimo' },
};

const render = (valor, entrada = ENTRADA) =>
  renderToStaticMarkup(
    <EscalaInput entrada={entrada} valor={valor} onCambiar={() => {}} />,
  );

it('sin valor muestra "Sin elegir" también para lectores de pantalla', () => {
  const html = render(null);
  expect(html).toContain('>Sin elegir<');
  expect(html).toContain('aria-valuetext="Sin elegir"');
});

it('0–10 con paso 1 y las etiquetas de los extremos (CA-27-3)', () => {
  const html = render(null);
  expect(html).toContain('min="0"');
  expect(html).toContain('max="10"');
  expect(html).toContain('step="1"');
  expect(html).toContain('>Nada<');
  expect(html).toContain('>Muchísimo<');
});

it('con valor muestra el número', () => {
  const html = render(7);
  expect(html).toContain('aria-valuetext="7"');
  expect(html).toContain('>7<');
  expect(html).not.toContain('Sin elegir');
});

it('paso null usa 1', () => {
  expect(render(null, { ...ENTRADA, paso: null })).toContain('step="1"');
});

it('con más de 11 posiciones solo marca los extremos', () => {
  const html = render(null, { min: 0, max: 100, paso: 1, etiquetas: null });
  expect(html).toContain('>100<');
  expect(html).not.toContain('>50<');
});
