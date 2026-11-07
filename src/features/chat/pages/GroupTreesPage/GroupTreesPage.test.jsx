import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { initialGroupTreesState } from './utils/groupTreesState.js';
import { GroupTreesPage } from './GroupTreesPage.jsx';

let pageState;

vi.mock('./hooks/useGroupTreesPage.js', () => ({
  useGroupTreesPage: () => pageState,
}));

const noop = () => {};

const listado = {
  items: [
    {
      id: 'f-1',
      nombre: 'Grupal base',
      estado: 'PUBLICADO',
      version: 1,
      fechaCreacion: '2026-11-01T15:00:00.000Z',
      fechaPublicacion: '2026-11-02T15:00:00.000Z',
      fechaArchivado: null,
    },
    {
      id: 'f-2',
      nombre: 'Grupal v2',
      estado: 'BORRADOR',
      version: 2,
      fechaCreacion: '2026-11-03T15:00:00.000Z',
      fechaPublicacion: null,
      fechaArchivado: null,
    },
  ],
  page: 1,
  totalPages: 1,
  total: 2,
};

function render(state) {
  pageState = {
    ...initialGroupTreesState,
    changeNombre: noop,
    createFlow: noop,
    changeEstado: noop,
    changePage: noop,
    retry: noop,
    ...state,
  };

  return renderToStaticMarkup(
    <MemoryRouter>
      <GroupTreesPage />
    </MemoryRouter>,
  );
}

describe('GroupTreesPage (RF-25, listar y crear)', () => {
  it('cargando: aviso accesible y listado ocupado', () => {
    const html = render({});

    expect(html).toContain('Consultando flujos');
    expect(html).toContain('aria-busy="true"');
  });

  it('muestra cada flujo con su estado en texto y su versión', () => {
    const html = render({ status: 'ready', listado });

    expect(html).toContain('Grupal base');
    expect(html).toContain('Publicado');
    expect(html).toContain('Borrador');
    expect(html).toContain('Versión 2');
  });

  it('sin flujos invita a crear el primero', () => {
    const html = render({
      status: 'ready',
      listado: { ...listado, items: [] },
    });

    expect(html).toContain('Aún no hay flujos grupales');
  });

  it('sin flujos con un filtro activo lo dice', () => {
    const html = render({
      status: 'ready',
      estado: 'ARCHIVADO',
      listado: { ...listado, items: [] },
    });

    expect(html).toContain('No hay flujos grupales con ese estado');
  });

  it('error al consultar: mensaje del backend y Reintentar', () => {
    const html = render({ status: 'error', loadError: 'Sin permisos.' });

    expect(html).toContain('role="alert"');
    expect(html).toContain('Sin permisos.');
    expect(html).toContain('Reintentar');
  });

  it('la paginación solo aparece con más de una página', () => {
    expect(render({ status: 'ready', listado })).not.toContain(
      'Paginación de flujos',
    );
    expect(
      render({ status: 'ready', listado: { ...listado, totalPages: 3 } }),
    ).toContain('Página 1 de 3');
  });

  it('formulario: error de nombre visible como texto', () => {
    const html = render({ nombreError: 'Escribe un nombre para el flujo.' });

    expect(html).toContain('Escribe un nombre para el flujo.');
    expect(html).toContain('Crear flujo');
  });

  it('formulario: aviso de éxito y de error al crear', () => {
    expect(
      render({ creation: { status: 'success', message: 'Flujo «X» creado.' } }),
    ).toContain('Flujo «X» creado.');

    const error = render({
      creation: { status: 'error', message: 'No se pudo.' },
    });
    expect(error).toContain('No se pudo crear el flujo');
    expect(error).toContain('No se pudo.');
  });
});
