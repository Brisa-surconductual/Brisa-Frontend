import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { CurrentContentPage } from './CurrentContentPage.jsx';

let contentsState;

vi.mock('../../hooks/useCurrentContents.js', () => ({
  useCurrentContents: () => contentsState,
}));

vi.mock('../../components/AssignedScheduleSummary/AssignedScheduleSummary.jsx', () => ({
  AssignedScheduleSummary: () => <p>resumen-cronograma</p>,
}));

vi.mock('@/features/cronograma/components/CurrentContentCard/index.js', () => ({
  CurrentContentCard: ({ content }) => <article>contenido-{content.id}</article>,
}));

function render(state) {
  contentsState = {
    currentContent: [],
    loading: false,
    loadError: '',
    retry: () => {},
    ...state,
  };

  return renderToStaticMarkup(
    <MemoryRouter>
      <CurrentContentPage />
    </MemoryRouter>,
  );
}

describe('Contenido vigente dentro del StudentLayout', () => {
  it('conserva título, regreso al inicio y resumen del cronograma', () => {
    const html = render();

    expect(html).toContain('Contenido vigente</h1>');
    expect(html).toContain('Volver al inicio');
    expect(html).toContain('resumen-cronograma');
  });

  it('estado de carga', () =>
    expect(render({ loading: true })).toMatch(
      /role="status"[^>]*>Cargando contenido vigente/,
    ));

  it('estado de error con reintento', () => {
    const html = render({ loadError: 'No pudimos consultar el contenido.' });

    expect(html).toContain('role="alert"');
    expect(html).toContain('No pudimos consultar el contenido.');
    expect(html).toContain('Reintentar consulta');
  });

  it('estado vacío', () =>
    expect(render()).toContain('No hay contenido vigente'));

  it('listado de contenido', () => {
    const html = render({
      currentContent: [{ id: 'c-1' }, { id: 'c-2' }],
    });

    expect(html).toContain('contenido-c-1');
    expect(html).toContain('contenido-c-2');
    expect(html).toContain('aria-label="Contenido vigente"');
  });

  it('no repite encabezado de app, navegación, cierre local ni <main>', () => {
    const html = render();

    expect(html).not.toContain('<main');
    expect(html).not.toContain('<nav');
    expect(html).not.toContain('Salir');
  });
});
