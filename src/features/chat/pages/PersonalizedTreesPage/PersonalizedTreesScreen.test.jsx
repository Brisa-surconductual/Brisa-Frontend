import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { initialPersonalizedTreesState } from './utils/personalizedTreesState.js';
import { PersonalizedTreesScreen } from './PersonalizedTreesScreen.jsx';

let screenState;

vi.mock('./hooks/usePersonalizedTreesPage.js', () => ({
  usePersonalizedTreesPage: () => screenState,
}));

const noop = () => {};

const flujo = (extra) => ({
  id_flujo: 'f-1',
  nombre: 'Árbol A',
  modalidad: 'PERSONALIZADA',
  tipo_dependencia: 'TOLERANCIA',
  tipo_craving: 'POSITIVO',
  version: 1,
  estado: 'PUBLICADO',
  ...extra,
});

function render(state) {
  screenState = {
    ...initialPersonalizedTreesState,
    requestAction: noop,
    confirmAction: noop,
    cancelConfirm: noop,
    retry: noop,
    ...state,
  };

  return renderToStaticMarkup(
    <MemoryRouter>
      <PersonalizedTreesScreen />
    </MemoryRouter>,
  );
}

describe('PersonalizedTreesScreen (RF-25C)', () => {
  it('cargando muestra el aviso de consulta', () => {
    expect(render({})).toContain('Consultando árboles conversacionales');
  });

  it('combinaciones sin árbol ofrecen crear el borrador', () => {
    const html = render({ status: 'ready', trees: [] });

    expect(html.match(/Crear borrador:/g)).toHaveLength(4);
  });

  it('un árbol publicado ofrece nueva versión y archivar, y nunca eliminar', () => {
    const html = render({ status: 'ready', trees: [flujo()] });

    expect(html).toContain('Nueva versión: Tolerancia · Craving positivo');
    expect(html).toContain('Archivar: Tolerancia · Craving positivo');
    expect(html).not.toMatch(/Eliminar|Borrar/);
  });

  it('un borrador ofrece publicar', () => {
    const html = render({
      status: 'ready',
      trees: [flujo({ estado: 'BORRADOR' })],
    });

    expect(html).toContain('Publicar: Tolerancia · Craving positivo');
  });

  it('muestra el aviso de éxito y el error de la acción', () => {
    const html = render({
      status: 'ready',
      trees: [],
      notice: 'Árbol publicado.',
      actionError: 'El árbol no está completo.',
    });

    expect(html).toContain('Árbol publicado.');
    expect(html).toContain('No se pudo completar la acción');
    expect(html).toContain('El árbol no está completo.');
  });

  it('un error al consultar muestra el mensaje del backend', () => {
    const html = render({ status: 'error', loadError: 'Sin permisos.' });

    expect(html).toContain(
      'No fue posible consultar los árboles conversacionales.',
    );
    expect(html).toContain('Sin permisos.');
  });

  it('con una acción pendiente muestra el diálogo de confirmación', () => {
    const html = render({
      status: 'ready',
      trees: [flujo({ estado: 'BORRADOR' })],
      confirm: { action: 'PUBLICAR', tree: flujo({ estado: 'BORRADOR' }) },
    });

    expect(html).toContain('¿Publicar este árbol?');
  });
});
