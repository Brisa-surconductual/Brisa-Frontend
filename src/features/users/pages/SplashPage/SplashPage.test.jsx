import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { SplashPage } from './SplashPage.jsx';

const html = renderToStaticMarkup(
  <MemoryRouter>
    <SplashPage />
  </MemoryRouter>,
);

it('tiene un solo h1 «Brisa»', () => {
  expect(html.match(/<h1/g)).toHaveLength(1);
  expect(html).toMatch(/<h1[^>]*>Brisa<\/h1>/);
});

it('lista los tres puntos de valor', () => {
  expect(html.match(/<li/g)).toHaveLength(3);
  expect(html).toContain('Actividades breves y guiadas');
  expect(html).toContain('Tu progreso, siempre a la vista');
  expect(html).toContain('Confidencial y voluntario');
});

it('muestra los tres CTA con las rutas de siempre', () => {
  expect(html).toContain('Instalar Brisa');
  expect(html).toMatch(/href="\/registro\/cuenta"[^>]*>Crear cuenta</);
  expect(html).toMatch(/href="\/login"[^>]*>Iniciar sesión</);
});

it('muestra el pie y no nombra el vapeo', () => {
  expect(html).toContain('Universidad Surcolombiana');
  expect(html).not.toMatch(/vape|vapeo/i);
});

it('oculta las ondas a lectores de pantalla y arranca con la hoja cerrada', () => {
  expect(html).toMatch(/aria-hidden="true" class="pointer-events-none/);
  expect(html).not.toContain('role="dialog"');
});
