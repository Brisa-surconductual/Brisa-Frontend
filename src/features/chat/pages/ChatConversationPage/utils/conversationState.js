import { esIdSesionValido } from '../../../services/nodoActual.js';

export const ESTADO_CONVERSACION = Object.freeze({
  CARGANDO: 'CARGANDO',
  LISTO: 'LISTO',
  ERROR: 'ERROR',
  // D13: dirección rota; no se consulta al backend.
  DIRECCION_INVALIDA: 'DIRECCION_INVALIDA',
});

const BASE = Object.freeze({
  estado: ESTADO_CONVERSACION.CARGANDO,
  conversacion: null,
  error: null,
  // Cada incremento dispara una petición del nodo actual.
  recarga: 0,
  // D7: la recarga por recurso caído se usa una sola vez por visita.
  reintentoUsado: false,
  recargando: false,
  // Índices (en `nodo.bloques`) de los recursos que fallaron.
  fallidos: Object.freeze([]),
});

export function crearEstadoInicial(idSesion) {
  return esIdSesionValido(idSesion)
    ? BASE
    : { ...BASE, estado: ESTADO_CONVERSACION.DIRECCION_INVALIDA };
}

// Tras la recarga de D7 solo siguen caídos los recursos cuya URL no
// cambió: la misma URL volvería a fallar y el navegador no la reintenta.
// Se compara por índice: el nodo es el mismo y sus bloques llegan en el
// mismo orden (mapNodoActual los ordena).
function fallidosTrasRecarga(state, conversacion) {
  const anterior = state.conversacion?.nodo;
  const nuevo = conversacion.nodo;

  if (!anterior || anterior.idNodo !== nuevo.idNodo) return [];

  return state.fallidos.filter(
    (i) => nuevo.bloques[i]?.url === anterior.bloques[i]?.url,
  );
}

export function conversationReducer(state, action) {
  switch (action.type) {
    case 'REINTENTAR':
      return {
        ...state,
        estado: ESTADO_CONVERSACION.CARGANDO,
        error: null,
        recarga: state.recarga + 1,
      };

    case 'EXITO':
      return {
        ...state,
        estado: ESTADO_CONVERSACION.LISTO,
        conversacion: action.conversacion,
        error: null,
        recargando: false,
        fallidos: state.recargando
          ? fallidosTrasRecarga(state, action.conversacion)
          : state.fallidos,
      };

    case 'ERROR':
      // D7: si falla la recarga, el nodo sigue visible con sus avisos.
      if (state.recargando) return { ...state, recargando: false };

      return {
        ...state,
        estado: ESTADO_CONVERSACION.ERROR,
        error: action.error,
      };

    case 'RECURSO_ERROR': {
      if (state.fallidos.includes(action.indice)) return state;

      const fallidos = [...state.fallidos, action.indice];

      if (state.reintentoUsado) return { ...state, fallidos };

      return {
        ...state,
        fallidos,
        reintentoUsado: true,
        recargando: true,
        recarga: state.recarga + 1,
      };
    }

    default:
      return state;
  }
}

// Items del hilo (A-018: viven en memoria; FE-M03-04 agrega respuestas).
// Un recurso se marca no disponible solo cuando ya no queda recarga.
export function selectItems(state) {
  const nodo = state.conversacion?.nodo;

  if (!nodo) return [];

  const sinRecarga = state.reintentoUsado && !state.recargando;
  const bloques = nodo.bloques.map((bloque, i) =>
    sinRecarga && state.fallidos.includes(i)
      ? { ...bloque, noDisponible: true }
      : bloque,
  );

  return [{ tipo: 'nodo', id: nodo.idNodo, nodo: { ...nodo, bloques } }];
}
