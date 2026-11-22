import { describe, expect, it } from 'vitest';

import {
  hayCambios,
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
      esNodoFinal: false,
      orden: '3',
      idContenidoCronograma: '',
      tieneEntrada: false,
      entradaTipo: 'OPCION_UNICA',
      entradaObligatorio: true,
      entradaOpciones: [
        { valor: '', etiqueta: '' },
        { valor: '', etiqueta: '' },
      ],
      entradaMinSelecciones: '',
      entradaMaxSelecciones: '',
      entradaMin: '',
      entradaMax: '',
      entradaEtiquetaMin: '',
      entradaEtiquetaMax: '',
      entradaMinPalabras: '',
      entradaMaxPalabras: '',
      entradaMaxCaracteres: '',
      entradaFormato: 'FECHA_HORA',
      capturaPerfilDimension: '',
      capturaPerfilValor: '',
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
      ordenEvaluacion: 1,
      regla: {
        operador: 'IGUALDAD',
        valorEsperado: { valor: 'si' },
        mensajeError: 'Revisa.',
      },
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
      valorUnico: 'si',
    });
  });

  it('cambiar el nodo origen reinicia el valor esperado (depende del nodo)', () => {
    const abierto = reduce(initialTreeDetailState, {
      type: 'TRANSITION_EDITOR_OPEN_CREATE',
    });
    const conValor = reduce(abierto, {
      type: 'TRANSITION_EDITOR_CHANGE',
      field: 'valorUnico',
      value: 'si',
    });
    const conMensaje = reduce(conValor, {
      type: 'TRANSITION_EDITOR_CHANGE',
      field: 'mensajeError',
      value: 'Revisa.',
    });
    const next = reduce(conMensaje, {
      type: 'TRANSITION_EDITOR_CHANGE',
      field: 'idNodoOrigen',
      value: 'otro',
    });

    expect(next.transitionEditor.values).toMatchObject({
      idNodoOrigen: 'otro',
      valorUnico: '',
      mensajeError: 'Revisa.',
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

describe('treeDetailReducer · descartar cambios del modal', () => {
  const abierto = reduce(initialTreeDetailState, {
    type: 'EDITOR_OPEN_CREATE',
  });

  it('un editor recién abierto no tiene cambios', () => {
    expect(hayCambios(abierto.editor)).toBe(false);
  });

  it('escribir algo marca cambios', () => {
    const next = reduce(abierto, {
      type: 'EDITOR_CHANGE',
      field: 'texto',
      value: 'Hola',
    });
    expect(hayCambios(next.editor)).toBe(true);
  });

  it('pedir el descarte abre la confirmación y cancelarla la cierra sin tocar el editor', () => {
    const pedido = reduce(abierto, {
      type: 'DESCARTE_SOLICITAR',
      editor: 'nodo',
    });
    expect(pedido.confirmDescarte).toBe('nodo');

    const cancelado = reduce(pedido, { type: 'DESCARTE_CANCELAR' });
    expect(cancelado.confirmDescarte).toBeNull();
    expect(cancelado.editor.mode).toBe('create');
  });

  it('cerrar el editor también cierra la confirmación pendiente', () => {
    const pedido = reduce(abierto, {
      type: 'DESCARTE_SOLICITAR',
      editor: 'nodo',
    });
    const cerrado = reduce(pedido, { type: 'EDITOR_CLOSE' });
    expect(cerrado.confirmDescarte).toBeNull();
    expect(cerrado.editor.mode).toBe('closed');
  });
});

describe('treeDetailReducer · usabilidad del editor (RF-25)', () => {
  const conEditor = (values) =>
    treeDetailReducer(
      {
        ...initialTreeDetailState,
        editor: { ...initialTreeDetailState.editor, values },
      },
      { type: 'NOOP' },
    );

  it('marcar nodo final apaga inicial, respuesta y captura', () => {
    const state = conEditor({
      ...initialTreeDetailState.editor.values,
      esNodoInicial: true,
      tieneEntrada: true,
      capturaPerfilDimension: 'TIPO_CRAVING',
      capturaPerfilValor: 'POSITIVO',
    });
    const next = treeDetailReducer(state, {
      type: 'EDITOR_CHANGE',
      field: 'esNodoFinal',
      value: true,
    });

    expect(next.editor.values).toMatchObject({
      esNodoFinal: true,
      esNodoInicial: false,
      tieneEntrada: false,
      capturaPerfilDimension: '',
      capturaPerfilValor: '',
    });
  });

  it('cambiar la dimensión reinicia el valor activado', () => {
    const state = conEditor({
      ...initialTreeDetailState.editor.values,
      capturaPerfilDimension: 'TIPO_CRAVING',
      capturaPerfilValor: 'POSITIVO',
    });
    const next = treeDetailReducer(state, {
      type: 'EDITOR_CHANGE',
      field: 'capturaPerfilDimension',
      value: 'TIPO_DEPENDENCIA',
    });

    expect(next.editor.values.capturaPerfilValor).toBe('');
  });

  it('elegir origen sugiere el orden y limpia un destino igual al origen', () => {
    const state = treeDetailReducer(initialTreeDetailState, {
      type: 'TRANSITION_EDITOR_OPEN_CREATE',
    });
    const conDestino = treeDetailReducer(state, {
      type: 'TRANSITION_EDITOR_CHANGE',
      field: 'idNodoDestino',
      value: 'n-1',
    });
    const next = treeDetailReducer(conDestino, {
      type: 'TRANSITION_EDITOR_ORIGEN',
      value: 'n-1',
      ordenSugerido: '3',
      destinoOtro: 'n-9',
    });

    expect(next.transitionEditor.values).toMatchObject({
      idNodoOrigen: 'n-1',
      idNodoDestino: '',
      ordenEvaluacion: '3',
      idNodoDestinoOtro: 'n-9',
    });
  });

  it('el aviso se puede limpiar (auto-cierre a los 8 s)', () => {
    const next = treeDetailReducer(
      { ...initialTreeDetailState, notice: 'Nodo creado.' },
      { type: 'NOTICE_CLEAR' },
    );
    expect(next.notice).toBe('');
  });
});
