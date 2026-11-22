import {
  ajustarNodoAVariable,
  variablePorCodigo,
} from '../../../services/taxonomiaVariables.js';
import {
  VALORES_NODO_VACIOS,
  valoresDesdeNodo,
} from '../../../services/nodosAdmin.js';
import {
  valoresDesdeTransicion,
  VALORES_TRANSICION_VACIOS,
} from '../../../services/transicionesAdmin.js';

const EDITOR_CERRADO = Object.freeze({
  mode: 'closed', // closed | create | edit
  nodo: null,
  values: VALORES_NODO_VACIOS,
  // Valores con los que se abrió: Cancelar solo pide confirmación si cambiaron.
  valoresIniciales: VALORES_NODO_VACIOS,
  errors: Object.freeze({}),
  saving: false,
  saveError: '',
});

const TRANSITION_EDITOR_CERRADO = Object.freeze({
  mode: 'closed', // closed | create | edit
  transicion: null,
  values: VALORES_TRANSICION_VACIOS,
  valoresIniciales: VALORES_TRANSICION_VACIOS,
  errors: Object.freeze({}),
  saving: false,
  saveError: '',
});

const REGLA_VACIA = Object.freeze({
  operador: VALORES_TRANSICION_VACIOS.operador,
  valorUnico: VALORES_TRANSICION_VACIOS.valorUnico,
  valoresMultiples: VALORES_TRANSICION_VACIOS.valoresMultiples,
  rangoMin: VALORES_TRANSICION_VACIOS.rangoMin,
  rangoMax: VALORES_TRANSICION_VACIOS.rangoMax,
});

// RF-25: reglas del formulario de nodo que dependen de otro campo:
// - inicial y final son excluyentes;
// - el nodo final no espera respuesta ni captura perfil;
// - cambiar la dimensión de captura reinicia su valor.
function valoresNodoCambiados(valores, field, value, variables = []) {
  let siguientes = { ...valores, [field]: value };
  if (field === 'esNodoFinal' && value) {
    siguientes.esNodoInicial = false;
    siguientes.tieneEntrada = false;
    siguientes.capturaPerfilDimension = '';
    siguientes.capturaPerfilValor = '';
    siguientes.variableCodigo = '';
  }
  // RF-30B: la variable filtra el tipo de respuesta del nodo.
  if (field === 'variableCodigo' && value !== valores[field]) {
    siguientes = ajustarNodoAVariable(
      siguientes,
      variablePorCodigo(variables, value),
    );
  }
  if (field === 'esNodoInicial' && value) siguientes.esNodoFinal = false;
  if (field === 'capturaPerfilDimension' && value !== valores[field]) {
    siguientes.capturaPerfilValor = '';
  }
  return siguientes;
}

// Si el formulario cambió respecto de como se abrió.
export function hayCambios(editor) {
  return (
    JSON.stringify(editor.values) !== JSON.stringify(editor.valoresIniciales)
  );
}

export const initialTreeDetailState = Object.freeze({
  status: 'loading', // loading | ready | error
  arbol: null,
  error: '',
  reloadKey: 0,
  tiposNodo: [],
  // RF-30B: taxonomía (incluye deshabilitadas para mostrar las ya usadas).
  variables: [],
  // RF-25/RF-24: contenidos (ya mapeados) con dónde está programado cada uno.
  contenidos: [],
  editor: EDITOR_CERRADO,
  // Editor de transiciones (RF-25, PR4): independiente del editor de nodos.
  transitionEditor: TRANSITION_EDITOR_CERRADO,
  // Confirmación de descartar cambios al cancelar un modal: 'nodo' | 'transicion' | null.
  confirmDescarte: null,
  notice: '',
  // RF-25: transiciones que se eliminarían al cambiar el tipo de respuesta
  // del nodo en edición; null = sin confirmación pendiente.
  confirmAfectadas: null,
  // Cambio de estado del flujo (publicar/archivar): confirmación pendiente,
  // acción en curso y error propio, independientes del editor de nodos.
  confirmEstado: null, // 'PUBLICAR' | 'ARCHIVAR' | null
  cambiandoEstado: false,
  errorEstado: '',
  // Condiciones legibles del 422 GRAFO_INVALIDO (RF-25); [] para otros errores.
  errorEstadoCondiciones: [],
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
        contenidos: action.contenidos,
      };

    case 'TAXONOMIA':
      return { ...state, variables: action.variables };

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
          valoresIniciales: valoresDesdeNodo(action.nodo),
        },
      };

    case 'EDITOR_CLOSE':
      return { ...state, editor: EDITOR_CERRADO, confirmDescarte: null };

    case 'EDITOR_CHANGE':
      return {
        ...state,
        editor: {
          ...state.editor,
          values: valoresNodoCambiados(
            state.editor.values,
            action.field,
            action.value,
            state.variables,
          ),
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

    case 'AFECTADAS_SOLICITAR':
      return {
        ...state,
        confirmAfectadas: action.transiciones,
        editor: { ...state.editor, saving: false },
      };

    case 'AFECTADAS_CANCELAR':
      return { ...state, confirmAfectadas: null };

    case 'NOTICE_CLEAR':
      return { ...state, notice: '' };

    case 'EDITOR_SAVED':
      // Cierra el formulario y vuelve a consultar el árbol.
      return {
        ...state,
        confirmAfectadas: null,
        editor: EDITOR_CERRADO,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'TRANSITION_EDITOR_OPEN_CREATE':
      return {
        ...state,
        notice: '',
        transitionEditor: { ...TRANSITION_EDITOR_CERRADO, mode: 'create' },
      };

    // RF-25: al elegir el origen se sugieren el orden de evaluación y el
    // destino actual de "cualquier otra respuesta"; un destino igual al
    // nuevo origen se limpia.
    case 'TRANSITION_EDITOR_ORIGEN':
      return {
        ...state,
        transitionEditor: {
          ...state.transitionEditor,
          values: {
            ...state.transitionEditor.values,
            ...REGLA_VACIA,
            idNodoOrigen: action.value,
            idNodoDestino:
              state.transitionEditor.values.idNodoDestino === action.value
                ? ''
                : state.transitionEditor.values.idNodoDestino,
            ordenEvaluacion: action.ordenSugerido,
            idNodoDestinoOtro: action.destinoOtro,
          },
          errors: {
            ...state.transitionEditor.errors,
            idNodoOrigen: undefined,
            ordenEvaluacion: undefined,
          },
          saveError: '',
        },
      };

    case 'TRANSITION_EDITOR_OPEN_EDIT':
      return {
        ...state,
        notice: '',
        transitionEditor: {
          ...TRANSITION_EDITOR_CERRADO,
          mode: 'edit',
          transicion: action.transicion,
          values: valoresDesdeTransicion(action.transicion),
          valoresIniciales: valoresDesdeTransicion(action.transicion),
        },
      };

    case 'TRANSITION_EDITOR_CLOSE':
      return {
        ...state,
        transitionEditor: TRANSITION_EDITOR_CERRADO,
        confirmDescarte: null,
      };

    case 'TRANSITION_EDITOR_CHANGE':
      return {
        ...state,
        transitionEditor: {
          ...state.transitionEditor,
          values: {
            ...state.transitionEditor.values,
            // RF-25: el valor esperado depende del nodo origen; al cambiarlo
            // se reinicia (el mensaje de error se conserva).
            ...(action.field === 'idNodoOrigen' ? REGLA_VACIA : {}),
            [action.field]: action.value,
          },
          errors: {
            ...state.transitionEditor.errors,
            [action.field]: undefined,
          },
          saveError: '',
        },
      };

    case 'TRANSITION_EDITOR_INVALID':
      return {
        ...state,
        transitionEditor: {
          ...state.transitionEditor,
          errors: action.errors,
        },
      };

    case 'TRANSITION_EDITOR_SAVING':
      return {
        ...state,
        transitionEditor: {
          ...state.transitionEditor,
          saving: true,
          saveError: '',
        },
      };

    case 'TRANSITION_EDITOR_SAVE_ERROR':
      return {
        ...state,
        transitionEditor: {
          ...state.transitionEditor,
          saving: false,
          saveError: action.message,
        },
      };

    case 'TRANSITION_EDITOR_SAVED':
      return {
        ...state,
        transitionEditor: TRANSITION_EDITOR_CERRADO,
        notice: action.message,
        status: 'loading',
        reloadKey: state.reloadKey + 1,
      };

    case 'DESCARTE_SOLICITAR':
      return { ...state, confirmDescarte: action.editor };

    case 'DESCARTE_CANCELAR':
      return { ...state, confirmDescarte: null };

    case 'ESTADO_CONFIRM_OPEN':
      return {
        ...state,
        confirmEstado: action.accion,
        notice: '',
        errorEstado: '',
        errorEstadoCondiciones: [],
      };

    case 'ESTADO_CONFIRM_CLOSE':
      return { ...state, confirmEstado: null };

    case 'ESTADO_ACCION_START':
      return {
        ...state,
        cambiandoEstado: true,
        errorEstado: '',
        errorEstadoCondiciones: [],
      };

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
        errorEstadoCondiciones: action.condiciones ?? [],
      };

    default:
      return state;
  }
}
