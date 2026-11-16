import { MENSAJE_RF34 } from '../../../types/index.js';

export const ESTADO_OFFLINE = Object.freeze({
  CARGANDO: 'CARGANDO',
  LISTO: 'LISTO',
  // Escribiendo en IndexedDB: el formulario queda bloqueado.
  GUARDANDO: 'GUARDANDO',
  // No se puede continuar sin conexión (mensaje de RF-34 o propio).
  BLOQUEADO: 'BLOQUEADO',
  // La lectura de la base falló por otra causa: se puede reintentar.
  ERROR_CARGA: 'ERROR_CARGA',
  COMPLETADA: 'COMPLETADA',
});

const { CARGANDO, LISTO, GUARDANDO, BLOQUEADO, ERROR_CARGA, COMPLETADA } =
  ESTADO_OFFLINE;

export const ERROR_FALLO_ESCRITURA = Object.freeze({
  codigo: 'FALLO_ESCRITURA',
  mensaje: MENSAJE_RF34.FALLO_ESCRITURA,
});

export const estadoInicialOffline = Object.freeze({
  estado: CARGANDO,
  paquete: null,
  // `{ nodo, recursosNoPresentados, otrosNoPresentables }` del nodo actual.
  actual: null,
  // Mensajes ya cerrados en esta visita (como en línea, solo en memoria).
  historial: Object.freeze([]),
  paso: 0,
  pendientes: 0,
  // Error junto al formulario: validación local o fallo de escritura.
  errorRespuesta: null,
  bloqueo: null,
  // Se retomó una sesión con respuestas guardadas en el dispositivo.
  retomada: false,
  recarga: 0,
});

const itemNodo = (state, actual = false) => ({
  tipo: 'nodo',
  id: `nodo-${state.paso}`,
  nodo: state.actual.nodo,
  ...(actual ? { actual: true } : {}),
});

function alGuardar(state, { textoRespuesta, siguiente, completada }) {
  const historial = [...state.historial, itemNodo(state)];

  if (textoRespuesta !== null) {
    historial.push({
      tipo: 'respuesta',
      id: `respuesta-${state.paso}`,
      texto: textoRespuesta,
    });
  }

  return {
    ...state,
    estado: completada ? COMPLETADA : LISTO,
    actual: siguiente,
    historial,
    paso: state.paso + 1,
    pendientes: state.pendientes + 1,
    errorRespuesta: null,
    retomada: false,
  };
}

export function offlineReducer(state, action) {
  switch (action.type) {
    case 'CARGA_EXITO': {
      const { paquete, actual, pendientes, completada } = action.datos;

      return {
        ...estadoInicialOffline,
        recarga: state.recarga,
        estado: completada ? COMPLETADA : LISTO,
        paquete,
        actual,
        pendientes,
        retomada: pendientes > 0,
      };
    }

    case 'CARGA_BLOQUEO':
      return {
        ...estadoInicialOffline,
        recarga: state.recarga,
        estado: BLOQUEADO,
        bloqueo: action.codigo,
      };

    case 'CARGA_ERROR':
      return {
        ...estadoInicialOffline,
        recarga: state.recarga,
        estado: ERROR_CARGA,
      };

    case 'REINTENTAR':
      return { ...estadoInicialOffline, recarga: state.recarga + 1 };

    case 'GUARDAR':
      if (state.estado !== LISTO) return state;
      return { ...state, estado: GUARDANDO, errorRespuesta: null };

    // Validación local: se queda en el nodo, nada se guardó.
    case 'RESPUESTA_INVALIDA':
      if (state.estado !== GUARDANDO) return state;
      return { ...state, estado: LISTO, errorRespuesta: action.error };

    // Regla 3: solo tras completarse la transacción se muestra el destino.
    case 'GUARDADO':
      if (state.estado !== GUARDANDO) return state;
      return alGuardar(state, action);

    // La escritura falló: no avanza y se puede volver a intentar.
    case 'FALLO_ESCRITURA':
      if (state.estado !== GUARDANDO) return state;
      return { ...state, estado: LISTO, errorRespuesta: ERROR_FALLO_ESCRITURA };

    // El nodo sigue a la vista; no se puede responder sin conexión.
    case 'BLOQUEO':
      if (state.estado !== GUARDANDO) return state;
      return {
        ...state,
        estado: BLOQUEADO,
        bloqueo: action.codigo,
        errorRespuesta: null,
      };

    default:
      return state;
  }
}

export function selectItems(state) {
  return state.actual
    ? [...state.historial, itemNodo(state, true)]
    : state.historial;
}

// El formulario solo existe mientras se puede responder.
export const selectNodoFormulario = (state) =>
  state.actual && (state.estado === LISTO || state.estado === GUARDANDO)
    ? state.actual.nodo
    : null;
