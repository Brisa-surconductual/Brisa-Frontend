import { describe, expect, it } from 'vitest';

import {
  groupTreesReducer,
  initialGroupTreesState,
} from './groupTreesState.js';

const reduce = (state, action) => groupTreesReducer(state, action);

describe('groupTreesReducer', () => {
  it('arranca cargando, sin filtro y en la primera página', () => {
    expect(initialGroupTreesState.status).toBe('loading');
    expect(initialGroupTreesState.estado).toBe('');
    expect(initialGroupTreesState.page).toBe(1);
  });

  it('filtrar vuelve a cargar con el filtro y la página pedidos', () => {
    const next = reduce(initialGroupTreesState, {
      type: 'FILTER',
      estado: 'BORRADOR',
      page: 2,
    });

    expect(next).toMatchObject({
      estado: 'BORRADOR',
      page: 2,
      status: 'loading',
    });
  });

  it('carga y error del listado', () => {
    const ok = reduce(initialGroupTreesState, {
      type: 'LOADED',
      listado: { items: [] },
    });
    expect(ok.status).toBe('ready');

    const fail = reduce(ok, { type: 'LOAD_ERROR', message: 'Falló.' });
    expect(fail).toMatchObject({ status: 'error', loadError: 'Falló.' });
  });

  it('escribir el nombre limpia el error y el aviso anterior', () => {
    const conError = {
      ...initialGroupTreesState,
      nombreError: 'x',
      creation: { status: 'error', message: 'y' },
    };
    const next = reduce(conError, { type: 'NAME_CHANGE', nombre: 'Flujo' });

    expect(next.nombre).toBe('Flujo');
    expect(next.nombreError).toBe('');
    expect(next.creation.status).toBe('idle');
  });

  it('crear con éxito limpia el formulario y recarga el listado completo', () => {
    const next = reduce(
      {
        ...initialGroupTreesState,
        nombre: 'Flujo',
        estado: 'PUBLICADO',
        page: 3,
      },
      { type: 'CREATE_OK', message: 'Creado.' },
    );

    expect(next).toMatchObject({
      nombre: '',
      estado: '',
      page: 1,
      status: 'loading',
      reloadKey: 1,
    });
    expect(next.creation).toEqual({ status: 'success', message: 'Creado.' });
  });

  it('un error al crear conserva el nombre escrito', () => {
    const next = reduce(
      { ...initialGroupTreesState, nombre: 'Flujo' },
      { type: 'CREATE_ERROR', message: 'No se pudo.' },
    );

    expect(next.nombre).toBe('Flujo');
    expect(next.creation).toEqual({ status: 'error', message: 'No se pudo.' });
  });
});
