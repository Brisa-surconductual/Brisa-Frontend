import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { StudentLayout } from './StudentLayout.jsx';
import {
  STUDENT_NAV_ITEMS,
  STUDENT_SECTION,
  getActiveStudentSection,
} from './studentNavigation.js';

const { logoutHandler, useLogoutHandler } = vi.hoisted(() => {
  const handler = () => {};
  return {
    logoutHandler: handler,
    useLogoutHandler: vi.fn(() => handler),
  };
});

vi.mock('@/shared/hooks/useLogoutHandler.jsx', () => ({ useLogoutHandler }));

function render(path) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<StudentLayout />}>
          <Route path="*" element={<p>Contenido de la página</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function navBlocks(html) {
  return [...html.matchAll(/<nav[^>]*>[\s\S]*?<\/nav>/g)].map(([block]) => block);
}

describe('Sección activa del estudiante', () => {
  it.each([
    ['/app/estudiante', STUDENT_SECTION.INICIO],
    ['/app/estudiante/', STUDENT_SECTION.INICIO],
    ['/app/estudiante/cronograma/contenido-vigente', STUDENT_SECTION.CONTENIDO],
    ['/app/administrativo', null],
  ])('%s → %s', (pathname, expected) =>
    expect(getActiveStudentSection(pathname)).toBe(expected));

  it('solo navega a rutas reales del estudiante', () =>
    expect(STUDENT_NAV_ITEMS.map(({ to }) => to)).toEqual([
      '/app/estudiante',
      '/app/estudiante/cronograma/contenido-vigente',
    ]));
});

describe('Layout del estudiante', () => {
  it('muestra la página dentro de un único <main>', () => {
    const html = render('/app/estudiante');

    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<header/g)).toHaveLength(1);
    expect(html).toMatch(
      /<main id="contenido-estudiante"[^>]*>[\s\S]*Contenido de la página[\s\S]*<\/main>/,
    );
  });

  it.each([
    ['/app/estudiante', 'Inicio'],
    ['/app/estudiante/cronograma/contenido-vigente', 'Contenido vigente'],
  ])('en %s marca activa "%s" en ambas navegaciones', (path, label) => {
    const html = render(path);
    const active = [
      ...html.matchAll(/<a[^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/g),
    ].map(([link]) => link);

    // Encabezado (tableta y escritorio) y barra inferior (móvil).
    expect(active).toHaveLength(2);
    expect(active[0]).toContain(label);
    expect(active[1]).toContain(`aria-label="${label}"`);
  });

  it('la navegación usa enlaces reales, sin pestañas ni botones deshabilitados', () => {
    const blocks = navBlocks(render('/app/estudiante'));

    expect(blocks).toHaveLength(2);
    for (const block of blocks) {
      expect(block).toContain('aria-label="Navegación del estudiante"');
      expect(block.match(/<a /g)).toHaveLength(2);
      expect(block).not.toContain('<button');
      expect(block).not.toContain('role="tab"');
      expect(block).not.toContain('disabled');
    }
  });

  it('los módulos futuros no aparecen como enlaces de navegación', () => {
    const navigation = navBlocks(render('/app/estudiante')).join('');

    for (const futureModule of ['Chat', 'Diario', 'Progreso', 'Perfil']) {
      expect(navigation).not.toContain(futureModule);
    }
  });

  it('cierra sesión con el mecanismo existente (useLogoutHandler)', () => {
    useLogoutHandler.mockClear();

    const html = render('/app/estudiante');

    expect(useLogoutHandler).toHaveBeenCalled();
    expect(logoutHandler).toBeTypeOf('function');
    expect(html).toMatch(/<button type="button"[^>]*>[\s\S]*?Salir<\/button>/);
  });

  it('respeta el área segura y reserva la altura de la barra inferior', () => {
    const html = render('/app/estudiante');

    expect(html).toContain('pb-[env(safe-area-inset-bottom)]');
    expect(html).toContain('pb-[calc(64px+env(safe-area-inset-bottom)+var(--space-6))]');
  });

  it('ofrece un enlace para saltar al contenido', () =>
    expect(render('/app/estudiante')).toContain('href="#contenido-estudiante"'));
});
