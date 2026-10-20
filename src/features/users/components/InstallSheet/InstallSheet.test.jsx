import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { InstallSheet } from './InstallSheet.jsx';

const render = (platform) =>
  renderToStaticMarkup(<InstallSheet platform={platform} onClose={() => {}} />);

const pressed = (html) =>
  [...html.matchAll(/aria-pressed="(true|false)"[^>]*>([^<]+)</g)].map(
    ([, value, label]) => `${label}:${value}`,
  );

it('es un diálogo modal etiquetado por su título', () => {
  const html = render('desktop');
  const labelledBy = html.match(/aria-labelledby="([^"]+)"/)[1];

  expect(html).toContain('role="dialog"');
  expect(html).toContain('aria-modal="true"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain(`id="${labelledBy}" tabindex="-1"`);
  expect(html).toMatch(/>Instala Brisa<\/h2>/);
});

it('abre con la pestaña detectada marcada y el aviso de detección', () => {
  const html = render('desktop');

  expect(html).toContain('aria-label="Elige tu dispositivo"');
  expect(pressed(html)).toEqual([
    'Android:false',
    'iPhone:false',
    'Computador:true',
  ]);
  expect(html).toContain('Detectamos tu dispositivo');
  expect(html).toContain('En Chrome');
});

it('en iPhone muestra los pasos de iPhone', () => {
  const html = render('ios');

  expect(html).toContain('<strong>«Agregar a inicio»</strong>');
  expect(html).not.toContain('En Chrome');
});

it('con navegador no compatible no marca ninguna pestaña', () => {
  const html = render('unsupported');

  expect(pressed(html).every((item) => item.endsWith(':false'))).toBe(true);
  expect(html).toContain('Tu navegador no permite agregar Brisa');
  expect(html).not.toContain('Detectamos tu dispositivo');
});

it('el fondo que cierra la hoja es un botón nativo fuera del orden de Tab', () => {
  const html = render('desktop');

  expect(html).toMatch(
    /<button type="button" tabindex="-1" aria-label="Cerrar instrucciones"/,
  );
  // El fondo va antes del diálogo, no dentro.
  expect(html.indexOf('Cerrar instrucciones')).toBeLessThan(
    html.indexOf('role="dialog"'),
  );
});

it('pinta los íconos de menú ocultos y termina en «Entendido»', () => {
  const html = render('android');

  expect(html).toContain('lucide-ellipsis-vertical');
  expect(html).toMatch(/>Entendido<\/button>/);
});
