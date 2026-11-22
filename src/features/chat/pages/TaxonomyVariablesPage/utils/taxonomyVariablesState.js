import {
  VALORES_VARIABLE_VACIOS,
  valoresVariableCambiados,
} from '../../../services/taxonomiaVariables.js';

const CREACION_CERRADA = Object.freeze({
  open: false,
  values: VALORES_VARIABLE_VACIOS,
  errors: {},
  saving: false,
  saveError: '',
});

export const initialTaxonomyState = Object.freeze({
  status: 'loading', // loading | ready | error
  error: '',
  version: '',
  variables: [],
  reloadKey: 0,
  notice: '',
  creacion: CREACION_CERRADA,
  // Variable cuya habilitación/deshabilitación se está confirmando.
  confirmacion: null,
  cambiando: '',
  cambioError: '',
});

export function taxonomyReducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        status: 'ready',
        error: '',
        version: action.version,
        variables: action.variables,
      };
    case 'ERROR':
      return { ...state, status: 'error', error: action.message };
    case 'RELOAD':
      return { ...state, status: 'loading', reloadKey: state.reloadKey + 1 };
    case 'NOTICE_CLEAR':
      return { ...state, notice: '' };

    case 'CREATE_OPEN':
      return {
        ...state,
        notice: '',
        creacion: { ...CREACION_CERRADA, open: true },
      };
    case 'CREATE_CLOSE':
      return { ...state, creacion: CREACION_CERRADA };
    case 'CREATE_CHANGE':
      return {
        ...state,
        creacion: {
          ...state.creacion,
          values: valoresVariableCambiados(
            state.creacion.values,
            action.field,
            action.value,
          ),
          errors: { ...state.creacion.errors, [action.field]: undefined },
          saveError: '',
        },
      };
    case 'CREATE_INVALID':
      return {
        ...state,
        creacion: { ...state.creacion, errors: action.errors },
      };
    case 'CREATE_SAVING':
      return {
        ...state,
        creacion: { ...state.creacion, saving: true, saveError: '' },
      };
    case 'CREATE_ERROR':
      return {
        ...state,
        creacion: {
          ...state.creacion,
          saving: false,
          saveError: action.message,
        },
      };
    case 'CREATE_SAVED':
      return {
        ...state,
        creacion: CREACION_CERRADA,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'TOGGLE_ASK':
      return { ...state, confirmacion: action.variable, cambioError: '' };
    case 'TOGGLE_CANCEL':
      return { ...state, confirmacion: null };
    case 'TOGGLE_SAVING':
      return { ...state, cambiando: action.codigo, cambioError: '' };
    case 'TOGGLE_ERROR':
      return {
        ...state,
        cambiando: '',
        confirmacion: null,
        cambioError: action.message,
      };
    case 'TOGGLE_SAVED':
      return {
        ...state,
        cambiando: '',
        confirmacion: null,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };
    default:
      return state;
  }
}
