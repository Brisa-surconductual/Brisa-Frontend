import { describe, expect, it } from 'vitest';

import {
  initialTreeDetailState,
  treeDetailReducer,
} from './treeDetailState.js';

const reduce = (state, action) => treeDetailReducer(state, action);

const nodo = {
  id: 'n-1',
  idTipoNodo: 't-1',
  texto: 'Hola',
  contenido: { texto: 'Hola' },
  esNodoInicial: false,
  orden: 3,
};

describe('treeDetailReducer · carga', () => {
  it('arranca cargando y con el editor cerrado', () => {
    expect(initialTreeDetailState.status).toBe('loading');
    expect(initialTreeDetailState.editor.mode).toBe('closed');
  });

  it('carga el árbol y limpia el error', () => {
    const next = reduce(
      { ...initialTreeDetailState, error: 'x' },
      { type: 'LOADED', arbol: { nodos: [] } },
    );

    expect(next).toMatchObject({ status: 'ready', error: '' });
  });

  it('guarda el mensaje de error y reintentar vuelve a cargar', () => {
    const fail = reduce(initialTreeDetailState, {
      type: 'ERROR',
      message: 'No existe.',
    });
    expect(fail).toMatchObject({ status: 'error', error: 'No existe.' });

    expect(reduce(fail, { type: 'RELOAD' })).toMatchObject({
      status: 'loading',
      reloadKey: 1,
    });
  });
});

describe('treeDetailReducer · editor de nodos', () => {
  it('abrir para crear parte de valores vacíos', () => {
    const next = reduce(initialTreeDetailState, { type: 'EDITOR_OPEN_CREATE' });

    expect(next.editor.mode).toBe('create');
    expect(next.editor.values.texto).toBe('');
  });

  it('abrir para editar precarga los valores del nodo', () => {
    const next = reduce(initialTreeDetailState, {
      type: 'EDITOR_OPEN_EDIT',
      nodo,
    });

    expect(next.editor).toMatchObject({ mode: 'edit', nodo });
    expect(next.editor.values).toEqual({
      idTipoNodo: 't-1',
      texto: 'Hola',
      esNodoInicial: false,
      orden: '3',
    });
  });

  it('escribir un campo limpia solo su error y el error de guardado', () => {
    const abierto = reduce(initialTreeDetailState, {
      type: 'EDITOR_OPEN_CREATE',
    });
    const conErrores = reduce(abierto, {
      type: 'EDITOR_INVALID',
      errors: { texto: 'x', orden: 'y' },
    });
    const next = reduce(conErrores, {
      type: 'EDITOR_CHANGE',
      field: 'texto',
      value: 'Hola',
    });

    expect(next.editor.values.texto).toBe('Hola');
    expect(next.editor.errors.texto).toBeUndefined();
    expect(next.editor.errors.orden).toBe('y');
  });

  it('un error al guardar conserva lo escrito y deja de guardar', () => {
    const guardando = reduce(
      reduce(initialTreeDetailState, { type: 'EDITOR_OPEN_CREATE' }),
      { type: 'EDITOR_SAVING' },
    );
    const next = reduce(guardando, {
      type: 'EDITOR_SAVE_ERROR',
      message: 'Ya hay un nodo inicial.',
    });

    expect(next.editor).toMatchObject({
      saving: false,
      saveError: 'Ya hay un nodo inicial.',
    });
    expect(next.editor.mode).toBe('create');
  });

  it('guardar cierra el editor, avisa y recarga el árbol', () => {
    const next = reduce(
      reduce(initialTreeDetailState, { type: 'EDITOR_OPEN_CREATE' }),
      { type: 'EDITOR_SAVED', message: 'Nodo creado.' },
    );

    expect(next).toMatchObject({
      notice: 'Nodo creado.',
      status: 'loading',
      reloadKey: 1,
    });
    expect(next.editor.mode).toBe('closed');
  });
});
