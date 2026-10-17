import { readFileSync } from 'node:fs';

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

// D18 · WCAG 2.2.2: el fondo se mueve como máximo 5 s y luego queda quieto.
const css = readFileSync(
  new URL('./SplashPage.css', import.meta.url),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const toSeconds = (value) => {
  const [, amount, unit] = value.match(/(\d+(?:\.\d+)?)(ms|s)\b/);

  return unit === 'ms' ? Number(amount) / 1000 : Number(amount);
};

it('las animaciones del fondo duran 5 s o menos y quedan quietas', () => {
  const animations = [...css.matchAll(/animation:\s*([^;]+);/g)]
    .map(([, value]) => value.trim())
    .filter((value) => value !== 'none');

  expect(css).not.toMatch(/infinite/);
  expect(css).not.toMatch(/animation-(duration|delay|iteration-count)/);
  expect(animations).toHaveLength(2);
  animations.forEach((value) => {
    // Un solo tiempo: sin retraso en la forma abreviada.
    expect(value.match(/\d+(?:\.\d+)?m?s\b/g)).toHaveLength(1);
    expect(value).toContain('forwards');
    expect(toSeconds(value)).toBeLessThanOrEqual(5);
  });
});

it('con prefers-reduced-motion no anima el fondo ni las ondas', () => {
  expect(css).toMatch(
    /prefers-reduced-motion: reduce\)\s*\{\s*\.splash-bg,\s*\.splash-wave\s*\{\s*animation: none;/,
  );
});
