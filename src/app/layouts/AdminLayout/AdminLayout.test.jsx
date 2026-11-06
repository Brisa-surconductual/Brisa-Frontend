import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AdminLayout } from './AdminLayout.jsx';

vi.mock('@/app/providers/index.js', () => ({
  useAuth: () => ({
    user: { email: 'admin.prueba@example.com' },
    role: 'ADMINISTRATIVO',
  }),
}));

vi.mock('@/shared/hooks/useLogoutHandler.jsx', () => ({
  useLogoutHandler: () => () => {},
}));

function render(path) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="*" element={<p>Contenido de la página</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function activeLinks(html) {
  return [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/g)].map(
    ([link]) => link.replace(/<[^>]+>/g, '').trim(),
  );
}

describe('Layout administrativo', () => {
  it('muestra el contenido de la página dentro del área principal', () => {
    const html = render('/app/administrativo');

    expect(html).toMatch(
      /<main id="contenido-administrativo"[^>]*>[\s\S]*Contenido de la página[\s\S]*<\/main>/,
    );
    expect(html.match(/<main/g)).toHaveLength(1);
  });

  it('usa navegación con enlaces, no pestañas', () => {
    const html = render('/app/administrativo');

    expect(html).toContain('<nav aria-label="Navegación administrativa"');
    expect(html).not.toContain('role="tab"');
    expect(html).toContain('href="/app/administrativo/cronograma"');
    expect(html).toContain('href="/app/administrativo/chat/modalidad"');
    expect(html).toContain('href="/app/administrativo?tab=POBLACION"');
    expect(html).toContain('href="/app/administrativo?tab=AJUSTES"');
  });

  it.each([
    ['/app/administrativo', 'Dashboard'],
    ['/app/administrativo?tab=POBLACION', 'Población'],
    ['/app/administrativo?tab=AJUSTES', 'Ajustes'],
    ['/app/administrativo/cronograma/s-1/panel', 'Cronogramas'],
    ['/app/administrativo/cronograma/contenidos/c-1/recursos', 'Cronogramas'],
    ['/app/administrativo/chat/arboles', 'Chat'],
  ])('en %s marca activa la sección %s', (path, label) => {
    const links = activeLinks(render(path));

    // Barra lateral (escritorio) y barra compacta (tableta).
    expect(links).toEqual([label, label]);
  });

  it('identifica el área y ofrece cerrar sesión', () => {
    const html = render('/app/administrativo');

    expect(html).toContain('Administración');
    expect(html).toContain('Administrativo');
    expect(html).toContain('admin.prueba@example.com');
    expect(html).toMatch(/<button[^>]*>[\s\S]*?Salir<\/button>/);
  });

  it('el menú móvil empieza cerrado y es accesible', () => {
    const html = render('/app/administrativo/cronograma');

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Abrir menú"');
    expect(html).toMatch(/aria-controls="[^"]+"/);
  });

  it('ofrece un enlace para saltar al contenido', () =>
    expect(render('/app/administrativo')).toContain(
      'href="#contenido-administrativo"',
    ));
});
