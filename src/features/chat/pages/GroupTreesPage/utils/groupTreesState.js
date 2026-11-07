import { ESTADO_FLUJO } from '../../../types/estadoFlujo.js';

export const initialGroupTreesState = Object.freeze({
  // Listado
  estado: '',
  page: 1,
  reloadKey: 0,
  status: 'loading', // loading | ready | error
  listado: null,
  loadError: '',
  // Catálogo de estados para el filtro (enum del backend)
  estadoOptions: Object.values(ESTADO_FLUJO),
  // Formulario de creación
  nombre: '',
  nombreError: '',
  creation: Object.freeze({ status: 'idle', message: '' }), // idle | saving | success | error
});

export function groupTreesReducer(state, action) {
  switch (action.type) {
    case 'FILTER':
      return {
        ...state,
        estado: action.estado,
        page: action.page,
        status: 'loading',
      };

    case 'RELOAD':
      return { ...state, status: 'loading', reloadKey: state.reloadKey + 1 };

    case 'LOADED':
      return {
        ...state,
        status: 'ready',
        listado: action.listado,
        loadError: '',
      };

    case 'LOAD_ERROR':
      return { ...state, status: 'error', loadError: action.message };

    case 'CATALOG':
      return { ...state, estadoOptions: action.estados };

    case 'NAME_CHANGE':
      return {
        ...state,
        nombre: action.nombre,
        nombreError: '',
        creation: initialGroupTreesState.creation,
      };

    case 'NAME_ERROR':
      return { ...state, nombreError: action.message };

    case 'CREATE_START':
      return { ...state, creation: { status: 'saving', message: '' } };

    case 'CREATE_OK':
      return {
        ...state,
        nombre: '',
        nombreError: '',
        creation: { status: 'success', message: action.message },
        // El nuevo borrador aparece al volver a la primera página, sin filtro.
        estado: '',
        page: 1,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'CREATE_ERROR':
      return {
        ...state,
        creation: { status: 'error', message: action.message },
      };

    default:
      return state;
  }
}
