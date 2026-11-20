import { anteponerSinDuplicar } from '../../../services/historialInteracciones.js';
import { esIdSesionValido } from '../../../services/nodoActual.js';
import { ESTADO_SESION } from '../../../types/index.js';

import { ACCION_ERROR_ENVIO, clasificarErrorEnvio } from './envio.js';

export const ESTADO_CONVERSACION = Object.freeze({
  CARGANDO: 'CARGANDO',
  LISTO: 'LISTO',
  ERROR: 'ERROR',
  // D13: dirección rota; no se consulta al backend.
  DIRECCION_INVALIDA: 'DIRECCION_INVALIDA',
  // RF-27 a RF-29: envío de la respuesta y carga del nodo siguiente.
  ENVIANDO: 'ENVIANDO',
  AVANZANDO: 'AVANZANDO',
  ERROR_ENVIO: 'ERROR_ENVIO',
  // D8 y A-016: sin más respuestas.
  COMPLETADA: 'COMPLETADA',
});

const {
  CARGANDO,
  LISTO,
  ERROR,
  DIRECCION_INVALIDA,
  ENVIANDO,
  AVANZANDO,
  ERROR_ENVIO,
  COMPLETADA,
} = ESTADO_CONVERSACION;

// RF-32: estado de la carga del historial, independiente del nodo actual.
export const ESTADO_HISTORIAL = Object.freeze({
  CARGANDO: 'CARGANDO',
  LISTO: 'LISTO',
  ERROR: 'ERROR',
});

// Estados en que el formulario del nodo actual sigue montado.
const CON_FORMULARIO = Object.freeze([LISTO, ENVIANDO, ERROR_ENVIO]);

const BASE = Object.freeze({
  estado: CARGANDO,
  // Respuesta mapeada del nodo actual (RF-26).
  conversacion: null,
  error: null,
  // Cada incremento dispara una petición del nodo actual.
  recarga: 0,
  // D7 de FE-M03-03 con D16: una recarga por recurso caído por nodo.
  reintentoUsado: false,
  recargando: false,
  // Índices (en `nodo.bloques`) de los recursos que fallaron.
  fallidos: Object.freeze([]),
  // RF-32: items ya cerrados. Llegan del servidor (historial) y se suman
  // en memoria mientras se avanza; una resincronización los reemplaza.
  historial: Object.freeze([]),
  historialEstado: ESTADO_HISTORIAL.CARGANDO,
  historialError: null,
  // Cada incremento dispara una petición del historial.
  recargaHistorial: 0,
  hayMas: false,
  secuenciaMinima: null,
  cargandoAnteriores: false,
  errorAnteriores: null,
  // RF-30: última secuencia confirmada; null hasta saberla.
  ultimaSecuencia: null,
  // Turno del nodo actual: da `key` estables aunque el flujo repita nodo.
  paso: 0,
  // D7: respuesta pendiente `{ cuerpo, textoRespuesta }`; el reintento
  // reenvía este mismo cuerpo.
  envio: null,
  errorEnvio: null,
  // D15: 409 NODO_DESACTUALIZADO, visible sobre el nodo nuevo.
  aviso: null,
});

export function crearEstadoInicial(idSesion) {
  return esIdSesionValido(idSesion)
    ? BASE
    : { ...BASE, estado: DIRECCION_INVALIDA };
}

// Tras la recarga de D7 solo siguen caídos los recursos cuya URL no
// cambió: la misma URL volvería a fallar y el navegador no la reintenta.
// Se compara por índice: el nodo es el mismo y sus bloques llegan en el
// mismo orden (mapNodoActual los ordena).
function fallidosTrasRecarga(state, conversacion) {
  const anterior = state.conversacion.nodo;
  const nuevo = conversacion.nodo;

  return state.fallidos.filter(
    (i) => nuevo.bloques[i]?.url === anterior.bloques[i]?.url,
  );
}

// Un recurso se marca no disponible solo cuando ya no queda recarga.
function nodoConMarcas(state) {
  const { nodo } = state.conversacion;
  const sinRecarga = state.reintentoUsado && !state.recargando;

  return {
    ...nodo,
    bloques: nodo.bloques.map((bloque, i) =>
      sinRecarga && state.fallidos.includes(i)
        ? { ...bloque, noDisponible: true }
        : bloque,
    ),
  };
}

const itemNodo = (state) => ({
  tipo: 'nodo',
  id: `nodo-${state.paso}`,
  nodo: nodoConMarcas(state),
});

const estadoTrasCarga = (state, conversacion) => {
  if (conversacion.estadoSesion === ESTADO_SESION.COMPLETADA) return COMPLETADA;
  // Una recarga de recursos durante el envío no cambia el estado.
  return state.estado === CARGANDO || state.estado === AVANZANDO
    ? LISTO
    : state.estado;
};

function alCargar(state, conversacion) {
  const anterior = state.conversacion;
  const comun = {
    ...state,
    estado: estadoTrasCarga(state, conversacion),
    conversacion,
    error: null,
    recargando: false,
  };

  // Mismo nodo (recarga de D7 o reintento): se reemplaza en su lugar.
  if (anterior?.nodo.idNodo === conversacion.nodo.idNodo) {
    return {
      ...comun,
      fallidos: state.recargando
        ? fallidosTrasRecarga(state, conversacion)
        : state.fallidos,
    };
  }

  // Nodo nuevo (D16): el anterior, si sigue visible, pasa al historial y
  // se reinician los recursos caídos.
  return {
    ...comun,
    historial: anterior
      ? [...state.historial, itemNodo(state)]
      : state.historial,
    paso: anterior ? state.paso + 1 : state.paso,
    reintentoUsado: false,
    fallidos: [],
  };
}

// D8: la burbuja con el texto de la respuesta (en CONTINUAR, sin burbuja)
// y luego el nodo que entregue RF-26.
function alEnviarConExito(state, respuesta) {
  const { textoRespuesta } = state.envio;
  const historial = [...state.historial, itemNodo(state)];

  if (textoRespuesta !== null) {
    historial.push({
      tipo: 'respuesta',
      id: `respuesta-${state.paso}`,
      texto: textoRespuesta,
    });
  }

  const completada = respuesta?.estadoSesion === ESTADO_SESION.COMPLETADA;

  return {
    ...state,
    ultimaSecuencia: masAlta(state.ultimaSecuencia, respuesta?.secuencia),
    estado: completada ? COMPLETADA : AVANZANDO,
    conversacion: null,
    historial,
    paso: state.paso + 1,
    reintentoUsado: false,
    recargando: false,
    fallidos: [],
    envio: null,
    errorEnvio: null,
    // CA-29-6: el destino no se calcula; se pide a RF-26.
    recarga: completada ? state.recarga : state.recarga + 1,
  };
}

// La secuencia nunca retrocede: una página anterior o una respuesta
// tardía no la rebajan.
function masAlta(actual, nueva) {
  if (!Number.isInteger(nueva)) return actual;
  return actual === null ? nueva : Math.max(actual, nueva);
}

// RF-32: la página más reciente reemplaza el hilo cerrado (carga inicial
// o resincronización). Los items en memoria quedan cubiertos por ella.
function alCargarHistorial(state, pagina) {
  return {
    ...state,
    historial: pagina.items,
    historialEstado: ESTADO_HISTORIAL.LISTO,
    historialError: null,
    hayMas: pagina.hayMas,
    secuenciaMinima: pagina.secuenciaMinima,
    errorAnteriores: null,
    ultimaSecuencia: masAlta(state.ultimaSecuencia, pagina.ultimaSecuencia),
  };
}

function alFallarEnvio(state, error) {
  switch (clasificarErrorEnvio(error)) {
    // CA-28-1 a CA-28-5: mismo nodo, respuesta editable y, al corregir,
    // idRespuesta nuevo.
    case ACCION_ERROR_ENVIO.INLINE:
      return { ...state, estado: LISTO, envio: null, errorEnvio: error };

    // CA-27-9 y CA-30-4: se descarta la respuesta y se piden el nodo
    // actual y el historial. El nodo viejo no pasa al hilo: el historial
    // del servidor dice qué se respondió de verdad.
    case ACCION_ERROR_ENVIO.DESACTUALIZADO:
      return {
        ...state,
        estado: AVANZANDO,
        conversacion: null,
        envio: null,
        aviso: error,
        recarga: state.recarga + 1,
        historialEstado: ESTADO_HISTORIAL.CARGANDO,
        recargaHistorial: state.recargaHistorial + 1,
      };

    // CA-27-8: se conserva el cuerpo para reenviarlo igual.
    case ACCION_ERROR_ENVIO.REINTENTAR:
      return { ...state, estado: ERROR_ENVIO, errorEnvio: error };

    default:
      return { ...state, estado: ERROR_ENVIO, envio: null, errorEnvio: error };
  }
}

export function conversationReducer(state, action) {
  switch (action.type) {
    case 'REINTENTAR':
      return {
        ...state,
        estado:
          state.conversacion || state.historial.length > 0
            ? AVANZANDO
            : CARGANDO,
        error: null,
        aviso: null,
        recarga: state.recarga + 1,
      };

    case 'EXITO':
      // Una recarga de recursos que llega tras completar la sesión ya no
      // tiene nodo que reponer (D8).
      if (state.estado === COMPLETADA) return state;

      return alCargar(state, action.conversacion);

    case 'ERROR':
      // D7: si falla la recarga, el nodo sigue visible con sus avisos.
      if (state.recargando) return { ...state, recargando: false };

      return { ...state, estado: ERROR, error: action.error };

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

    // D12: una petición a la vez. Fuera de LISTO no sale otra.
    case 'ENVIAR':
      if (state.estado !== LISTO) return state;

      return {
        ...state,
        estado: ENVIANDO,
        envio: action.envio,
        errorEnvio: null,
        aviso: null,
      };

    case 'REINTENTAR_ENVIO':
      if (state.estado !== ERROR_ENVIO || !state.envio) return state;

      return { ...state, estado: ENVIANDO, errorEnvio: null };

    case 'ENVIO_EXITO':
      if (state.estado !== ENVIANDO) return state;

      return alEnviarConExito(state, action.respuesta);

    case 'ENVIO_ERROR':
      if (state.estado !== ENVIANDO) return state;

      return alFallarEnvio(state, action.error);

    case 'HISTORIAL_EXITO':
      return alCargarHistorial(state, action.pagina);

    case 'HISTORIAL_ERROR':
      return {
        ...state,
        historialEstado: ESTADO_HISTORIAL.ERROR,
        historialError: action.error,
      };

    case 'REINTENTAR_HISTORIAL':
      return {
        ...state,
        historialEstado: ESTADO_HISTORIAL.CARGANDO,
        historialError: null,
        recargaHistorial: state.recargaHistorial + 1,
      };

    // CA-32-2: una página anterior a la vez.
    case 'CARGAR_ANTERIORES':
      if (!state.hayMas || state.cargandoAnteriores) return state;

      return { ...state, cargandoAnteriores: true, errorAnteriores: null };

    case 'ANTERIORES_EXITO':
      return {
        ...state,
        historial: anteponerSinDuplicar(action.pagina.items, state.historial),
        hayMas: action.pagina.hayMas,
        secuenciaMinima: action.pagina.secuenciaMinima ?? state.secuenciaMinima,
        cargandoAnteriores: false,
        ultimaSecuencia: masAlta(
          state.ultimaSecuencia,
          action.pagina.ultimaSecuencia,
        ),
      };

    case 'ANTERIORES_ERROR':
      return {
        ...state,
        cargandoAnteriores: false,
        errorAnteriores: action.error,
      };

    default:
      return state;
  }
}

// Items del hilo: el historial y, al final, el nodo actual.
export function selectItems(state) {
  if (!state.conversacion) return state.historial;

  return [...state.historial, { ...itemNodo(state), actual: true }];
}

// D9: con la sesión completada o mientras se carga, no hay formulario.
export function selectNodoFormulario(state) {
  return state.conversacion && CON_FORMULARIO.includes(state.estado)
    ? state.conversacion.nodo
    : null;
}

// RF-30: la secuencia del próximo envío. Sin historial (sesión nueva o
// historial caído) se parte de 1; si no coincide, el backend responde
// SECUENCIA_FUERA_DE_ORDEN y se resincroniza.
export function selectSecuenciaSiguiente(state) {
  return (state.ultimaSecuencia ?? 0) + 1;
}

// RF-33 y RF-30: `idRecurso` de los recursos del nodo actual que siguen
// sin mostrarse después del único reintento.
export function selectRecursosNoPresentados(state) {
  if (!state.conversacion) return [];

  return nodoConMarcas(state)
    .bloques.filter((bloque) => bloque.noDisponible && bloque.idRecurso)
    .map((bloque) => bloque.idRecurso);
}
