import {
  VALORES_NODO_VACIOS,
  valoresDesdeNodo,
} from '../../../services/nodosAdmin.js';

const EDITOR_CERRADO = Object.freeze({
  mode: 'closed', // closed | create | edit
  nodo: null,
  values: VALORES_NODO_VACIOS,
  errors: Object.freeze({}),
  saving: false,
  saveError: '',
});

export const initialTreeDetailState = Object.freeze({
  status: 'loading', // loading | ready | error
  arbol: null,
  error: '',
  reloadKey: 0,
  tiposNodo: [],
  // Catálogo crudo de `contenidos_cronograma` (RF-25): contenido ya
  // asociado a una unidad temporal, disponible para vincular a un nodo.
  contenidosCronograma: [],
  editor: EDITOR_CERRADO,
  notice: '',
  // Cambio de estado del flujo (publicar/archivar): confirmación pendiente,
  // acción en curso y error propio, independientes del editor de nodos.
  confirmEstado: null, // 'PUBLICAR' | 'ARCHIVAR' | null
  cambiandoEstado: false,
  errorEstado: '',
});

export function treeDetailReducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return { ...state, status: 'ready', arbol: action.arbol, error: '' };

    case 'ERROR':
      return { ...state, status: 'error', error: action.message };

    case 'RELOAD':
      return { ...state, status: 'loading', reloadKey: state.reloadKey + 1 };

    case 'CATALOG':
      return {
        ...state,
        tiposNodo: action.tiposNodo,
        contenidosCronograma: action.contenidosCronograma,
      };

    case 'EDITOR_OPEN_CREATE':
      return {
        ...state,
        notice: '',
        editor: { ...EDITOR_CERRADO, mode: 'create' },
      };

    case 'EDITOR_OPEN_EDIT':
      return {
        ...state,
        notice: '',
        editor: {
          ...EDITOR_CERRADO,
          mode: 'edit',
          nodo: action.nodo,
          values: valoresDesdeNodo(action.nodo),
        },
      };

    case 'EDITOR_CLOSE':
      return { ...state, editor: EDITOR_CERRADO };

    case 'EDITOR_CHANGE':
      return {
        ...state,
        editor: {
          ...state.editor,
          values: { ...state.editor.values, [action.field]: action.value },
          errors: { ...state.editor.errors, [action.field]: undefined },
          saveError: '',
        },
      };

    case 'EDITOR_INVALID':
      return { ...state, editor: { ...state.editor, errors: action.errors } };

    case 'EDITOR_SAVING':
      return {
        ...state,
        editor: { ...state.editor, saving: true, saveError: '' },
      };

    case 'EDITOR_SAVE_ERROR':
      return {
        ...state,
        editor: { ...state.editor, saving: false, saveError: action.message },
      };

    case 'EDITOR_SAVED':
      // Cierra el formulario y vuelve a consultar el árbol.
      return {
        ...state,
        editor: EDITOR_CERRADO,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'ESTADO_CONFIRM_OPEN':
      return {
        ...state,
        confirmEstado: action.accion,
        notice: '',
        errorEstado: '',
      };

    case 'ESTADO_CONFIRM_CLOSE':
      return { ...state, confirmEstado: null };

    case 'ESTADO_ACCION_START':
      return { ...state, cambiandoEstado: true, errorEstado: '' };

    case 'ESTADO_ACCION_OK':
      // Cierra la confirmación y vuelve a consultar el árbol (nuevo estado).
      return {
        ...state,
        cambiandoEstado: false,
        confirmEstado: null,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'ESTADO_ACCION_ERROR':
      return {
        ...state,
        cambiandoEstado: false,
        confirmEstado: null,
        errorEstado: action.message,
      };

    default:
      return state;
  }
}
