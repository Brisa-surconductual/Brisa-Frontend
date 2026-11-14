import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { initialTreeDetailState } from './utils/treeDetailState.js';
import { GroupTreeDetailPage } from './GroupTreeDetailPage.jsx';

let pageState;

vi.mock('./hooks/useGroupTreeDetailPage.js', () => ({
  useGroupTreeDetailPage: () => pageState,
}));

const arbol = {
  flujo: {
    id: 'f-1',
    nombre: 'Grupal base',
    estado: 'BORRADOR',
    version: 1,
  },
  nodos: [
    {
      id: 'a',
      tipoNodo: 'MENSAJE',
      texto: 'Bienvenido a Brisa.',
      esNodoInicial: true,
      orden: 1,
      etiqueta: '1. Bienvenido a Brisa.',
    },
    {
      id: 'b',
      tipoNodo: 'PREGUNTA',
      texto: '',
      esNodoInicial: false,
      orden: null,
      etiqueta: '2. (sin texto)',
    },
  ],
  transiciones: [
    {
      id: 't1',
      origen: '1. Bienvenido a Brisa.',
      destino: '2. (sin texto)',
      operador: 'IGUALDAD',
      condicion: 'valor: Sí',
      ordenEvaluacion: 1,
    },
  ],
};

function render(state) {
  pageState = {
    ...initialTreeDetailState,
    retry: () => {},
    accionesEstado: [],
    solicitarCambioEstado: () => {},
    cancelarCambioEstado: () => {},
    confirmarCambioEstado: () => {},
    ...state,
  };

  return renderToStaticMarkup(
    <MemoryRouter>
      <GroupTreeDetailPage />
    </MemoryRouter>,
  );
}

describe('GroupTreeDetailPage (RF-25, vista del árbol)', () => {
  it('cargando: aviso accesible y enlace para volver', () => {
    const html = render({});

    expect(html).toContain('Consultando el árbol');
    expect(html).toContain('href="/app/administrativo/chat/grupal"');
  });

  it('muestra el flujo, sus nodos (con el inicial marcado) y sus transiciones', () => {
    const html = render({ status: 'ready', arbol });

    expect(html).toContain('Grupal base');
    expect(html).toContain('Borrador');
    expect(html).toContain('Bienvenido a Brisa.');
    expect(html).toContain('Nodo inicial');
    expect(html).toContain('Sin texto.');
    expect(html).toContain('Igualdad');
    expect(html).toContain('valor: Sí');
    expect(html).toContain('Evaluación 1');
  });

  it('un árbol vacío lo dice en nodos y en transiciones', () => {
    const html = render({
      status: 'ready',
      arbol: { ...arbol, nodos: [], transiciones: [] },
    });

    expect(html).toContain('Este flujo aún no tiene nodos.');
    expect(html).toContain('Este flujo aún no tiene transiciones.');
  });

  it('error: mensaje del backend y Reintentar', () => {
    const html = render({ status: 'error', error: 'El flujo no existe.' });

    expect(html).toContain('role="alert"');
    expect(html).toContain('El flujo no existe.');
    expect(html).toContain('Reintentar');
  });

  it('un flujo que no es borrador es de solo lectura: sin formulario ni botones de edición', () => {
    const html = render({ status: 'ready', arbol, canEdit: false });

    expect(html).not.toContain('<form');
    expect(html).not.toContain('Agregar nodo');
    expect(html).not.toContain('Editar');
  });

  it('un borrador permite agregar y editar nodos', () => {
    const html = render({ status: 'ready', arbol, canEdit: true });

    expect(html).toContain('Agregar nodo');
    expect(html).toContain('Editar');
  });

  it('con el editor abierto muestra el formulario con sus errores en texto', () => {
    const html = render({
      status: 'ready',
      arbol,
      canEdit: true,
      tiposNodo: [{ value: 't-1', label: 'MENSAJE' }],
      editor: {
        mode: 'create',
        nodo: null,
        values: { idTipoNodo: '', texto: '', esNodoInicial: false, orden: '' },
        errors: { texto: 'Escribe el texto del nodo.' },
        saving: false,
        saveError: 'Ya existe un nodo inicial.',
      },
    });

    expect(html).toContain('Nuevo nodo');
    expect(html).toContain('MENSAJE');
    expect(html).toContain('Escribe el texto del nodo.');
    expect(html).toContain('Ya existe un nodo inicial.');
    expect(html).not.toContain('Agregar nodo');
  });

  it('muestra el aviso de éxito tras guardar', () => {
    expect(
      render({ status: 'ready', arbol, notice: 'Nodo creado.' }),
    ).toContain('Nodo creado.');
  });
});

describe('GroupTreeDetailPage · cambio de estado del flujo', () => {
  it('un borrador ofrece publicar y archivar', () => {
    const html = render({
      status: 'ready',
      arbol,
      accionesEstado: ['PUBLICAR', 'ARCHIVAR'],
    });

    expect(html).toContain('Publicar');
    expect(html).toContain('Archivar');
  });

  it('un publicado solo ofrece archivar, nunca despublicar', () => {
    const html = render({
      status: 'ready',
      arbol: { ...arbol, flujo: { ...arbol.flujo, estado: 'PUBLICADO' } },
      accionesEstado: ['ARCHIVAR'],
    });

    expect(html).toContain('Archivar');
    expect(html).not.toContain('Publicar');
  });

  it('un archivado no ofrece ninguna acción de estado', () => {
    const html = render({
      status: 'ready',
      arbol: { ...arbol, flujo: { ...arbol.flujo, estado: 'ARCHIVADO' } },
      accionesEstado: [],
    });

    expect(html).not.toContain('Publicar');
    expect(html).not.toContain('>Archivar<');
  });

  it('con una acción pendiente muestra el diálogo de confirmación', () => {
    const html = render({
      status: 'ready',
      arbol,
      accionesEstado: ['PUBLICAR', 'ARCHIVAR'],
      confirmEstado: 'PUBLICAR',
    });

    expect(html).toContain('¿Publicar este flujo?');
  });

  it('muestra el error propio del cambio de estado', () => {
    const html = render({
      status: 'ready',
      arbol,
      accionesEstado: ['PUBLICAR', 'ARCHIVAR'],
      errorEstado: 'El árbol no cumple las condiciones de integridad.',
    });

    expect(html).toContain('role="alert"');
    expect(html).toContain('El árbol no cumple las condiciones de integridad.');
  });
});
