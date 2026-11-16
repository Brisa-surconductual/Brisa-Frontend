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

describe('treeDetailReducer · catálogos', () => {
  it('arranca sin tipos de nodo ni contenidos de cronograma', () => {
    expect(initialTreeDetailState.tiposNodo).toEqual([]);
    expect(initialTreeDetailState.contenidosCronograma).toEqual([]);
  });

  it('guarda los tipos de nodo y los contenidos de cronograma del catálogo', () => {
    const next = reduce(initialTreeDetailState, {
      type: 'CATALOG',
      tiposNodo: [{ value: 't-1', label: 'MENSAJE' }],
      contenidosCronograma: [{ id_contenido_cronograma: 'cc-1' }],
    });

    expect(next.tiposNodo).toEqual([{ value: 't-1', label: 'MENSAJE' }]);
    expect(next.contenidosCronograma).toEqual([
      { id_contenido_cronograma: 'cc-1' },
    ]);
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
      idContenidoCronograma: '',
      tieneEntrada: false,
      entradaTipo: 'TEXTO_LIBRE',
      entradaObligatorio: true,
      entradaOpciones: [
        { valor: '', etiqueta: '' },
        { valor: '', etiqueta: '' },
      ],
      entradaMinSelecciones: '',
      entradaMaxSelecciones: '',
      entradaMin: '',
      entradaMax: '',
      entradaPaso: '',
      entradaEtiquetaMin: '',
      entradaEtiquetaMax: '',
      entradaMinPalabras: '',
      entradaMaxPalabras: '',
      entradaMaxCaracteres: '',
      entradaFormato: 'FECHA_HORA',
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

describe('treeDetailReducer · catálogo de reglas de validación (PR4)', () => {
  it('arranca sin reglas de validación', () => {
    expect(initialTreeDetailState.reglasValidacion).toEqual([]);
  });

  it('el catálogo también guarda las reglas de validación', () => {
    const next = reduce(initialTreeDetailState, {
      type: 'CATALOG',
      tiposNodo: [],
      contenidosCronograma: [],
      reglasValidacion: [{ id_regla_validacion: 'r-1' }],
    });

    expect(next.reglasValidacion).toEqual([{ id_regla_validacion: 'r-1' }]);
  });
});

describe('treeDetailReducer · editor de transiciones (PR4)', () => {
  it('arranca con el editor de transiciones cerrado', () => {
    expect(initialTreeDetailState.transitionEditor.mode).toBe('closed');
  });

  it('abrir para crear parte de valores vacíos', () => {
    const next = reduce(initialTreeDetailState, {
      type: 'TRANSITION_EDITOR_OPEN_CREATE',
    });

    expect(next.transitionEditor.mode).toBe('create');
    expect(next.transitionEditor.values.idNodoOrigen).toBe('');
  });

  it('abrir para editar precarga los valores de la transición', () => {
    const transicion = {
      origenId: 'a',
      destinoId: 'b',
      operador: 'IGUALDAD',
      valorCondicion: { valor: 'Sí' },
      ordenEvaluacion: 1,
      idReglaValidacion: 'r-1',
    };
    const next = reduce(initialTreeDetailState, {
      type: 'TRANSITION_EDITOR_OPEN_EDIT',
      transicion,
    });

    expect(next.transitionEditor).toMatchObject({
      mode: 'edit',
      transicion,
    });
    expect(next.transitionEditor.values).toMatchObject({
      idNodoOrigen: 'a',
      idNodoDestino: 'b',
      valorIgualdad: 'Sí',
    });
  });

  it('escribir un campo limpia solo su error y el error de guardado', () => {
    const abierto = reduce(initialTreeDetailState, {
      type: 'TRANSITION_EDITOR_OPEN_CREATE',
    });
    const conErrores = reduce(abierto, {
      type: 'TRANSITION_EDITOR_INVALID',
      errors: { idNodoOrigen: 'x', ordenEvaluacion: 'y' },
    });
    const next = reduce(conErrores, {
      type: 'TRANSITION_EDITOR_CHANGE',
      field: 'idNodoOrigen',
      value: 'a',
    });

    expect(next.transitionEditor.values.idNodoOrigen).toBe('a');
    expect(next.transitionEditor.errors.idNodoOrigen).toBeUndefined();
    expect(next.transitionEditor.errors.ordenEvaluacion).toBe('y');
  });

  it('un error al guardar conserva lo escrito y deja de guardar', () => {
    const guardando = reduce(
      reduce(initialTreeDetailState, { type: 'TRANSITION_EDITOR_OPEN_CREATE' }),
      { type: 'TRANSITION_EDITOR_SAVING' },
    );
    const next = reduce(guardando, {
      type: 'TRANSITION_EDITOR_SAVE_ERROR',
      message: 'El nodo destino definido no es válido.',
    });

    expect(next.transitionEditor).toMatchObject({
      saving: false,
      saveError: 'El nodo destino definido no es válido.',
    });
    expect(next.transitionEditor.mode).toBe('create');
  });

  it('guardar cierra el editor, avisa y recarga el árbol', () => {
    const next = reduce(
      reduce(initialTreeDetailState, { type: 'TRANSITION_EDITOR_OPEN_CREATE' }),
      { type: 'TRANSITION_EDITOR_SAVED', message: 'Transición creada.' },
    );

    expect(next).toMatchObject({
      notice: 'Transición creada.',
      status: 'loading',
      reloadKey: 1,
    });
    expect(next.transitionEditor.mode).toBe('closed');
  });

  it('cerrar el editor de transición no afecta el editor de nodos', () => {
    const conAmbos = reduce(
      reduce(initialTreeDetailState, { type: 'EDITOR_OPEN_CREATE' }),
      { type: 'TRANSITION_EDITOR_OPEN_CREATE' },
    );
    const next = reduce(conAmbos, { type: 'TRANSITION_EDITOR_CLOSE' });

    expect(next.transitionEditor.mode).toBe('closed');
    expect(next.editor.mode).toBe('create');
  });
});

describe('treeDetailReducer · cambio de estado del flujo', () => {
  it('arranca sin confirmación pendiente ni error', () => {
    expect(initialTreeDetailState).toMatchObject({
      confirmEstado: null,
      cambiandoEstado: false,
      errorEstado: '',
    });
  });

  it('abrir y cerrar la confirmación', () => {
    const abierta = reduce(initialTreeDetailState, {
      type: 'ESTADO_CONFIRM_OPEN',
      accion: 'PUBLICAR',
    });

    expect(abierta.confirmEstado).toBe('PUBLICAR');
    expect(
      reduce(abierta, { type: 'ESTADO_CONFIRM_CLOSE' }).confirmEstado,
    ).toBeNull();
  });

  it('una acción exitosa cierra la confirmación, avisa y recarga el árbol', () => {
    const next = reduce(
      {
        ...initialTreeDetailState,
        cambiandoEstado: true,
        confirmEstado: 'PUBLICAR',
      },
      { type: 'ESTADO_ACCION_OK', message: 'Flujo publicado.' },
    );

    expect(next).toMatchObject({
      cambiandoEstado: false,
      confirmEstado: null,
      notice: 'Flujo publicado.',
      status: 'loading',
      reloadKey: 1,
    });
  });

  it('una acción fallida muestra el mensaje y no recarga', () => {
    const next = reduce(
      {
        ...initialTreeDetailState,
        cambiandoEstado: true,
        confirmEstado: 'ARCHIVAR',
      },
      { type: 'ESTADO_ACCION_ERROR', message: 'El estado no lo permite.' },
    );

    expect(next).toMatchObject({
      cambiandoEstado: false,
      confirmEstado: null,
      errorEstado: 'El estado no lo permite.',
      reloadKey: 0,
    });
  });
});
