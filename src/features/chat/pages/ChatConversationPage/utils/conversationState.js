import {
  anteponerSinDuplicar,
  mapHistorial,
} from '../../../services/historialInteracciones.js';
import { esIdSesionValido } from '../../../services/nodoActual.js';
import { ESTADO_SESION } from '../../../types/index.js';

import {
  ACCION_ERROR_ENVIO,
  CODIGOS_RECUPERAR,
  clasificarErrorEnvio,
} from './envio.js';

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
  // RF-37: esperando el último estado válido de /iniciar.
  RECUPERANDO: 'RECUPERANDO',
});

// RF-37: rechazos de validación consecutivos en un nodo antes de ofrecer
// ayuda.
export const UMBRAL_RECHAZOS_VALIDACION = 3;

const {
  CARGANDO,
  LISTO,
  ERROR,
  DIRECCION_INVALIDA,
  ENVIANDO,
  AVANZANDO,
  ERROR_ENVIO,
  COMPLETADA,
  RECUPERANDO,
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
  // RF-32: el nodo o la página reciente ya llegaron con /iniciar; la
  // primera consulta por GET se omite (las recargas posteriores no).
  nodoPrecargado: false,
  historialPrecargado: false,
  // RF-32: `recuperada_desde_historial` de /iniciar.
  recuperadaDesdeHistorial: false,
  // Paso en que llegó ese estado: el aviso se ve hasta el primer avance.
  pasoRecuperada: 0,
  // RF-37: respuestas del nodo actual rechazadas por validación (400), sin
  // contar dos veces el mismo `id_interaccion`.
  rechazosValidacion: 0,
  ultimoRechazo: null,
  ayudaSolicitada: false,
  // RF-37: cada incremento pide /iniciar. Una sola recuperación automática
  // hasta el siguiente envío aceptado: si falla, no se encadenan más.
  recuperacion: 0,
  recuperacionUsada: false,
  // Tras una recuperación fallida, «Reintentar» pide también el historial.
  historialPendiente: false,
});

const SIN_RECHAZOS = Object.freeze({
  rechazosValidacion: 0,
  ultimoRechazo: null,
  ayudaSolicitada: false,
});

/*
 * RF-32: modelo de /iniciar (`mapInicioSesion`) → `inicio` para
 * `crearEstadoInicial`. La página reciente se mapea igual que la del GET
 * (`mapHistorial`, con `textoDe` del registro de entradas).
 */
export function prepararInicio(modelo, textoDe) {
  if (!modelo?.conversacion) return null;

  return {
    conversacion: modelo.conversacion,
    pagina: modelo.historialReciente
      ? mapHistorial(modelo.historialReciente, textoDe)
      : null,
    ultimaSecuencia: modelo.sesion?.ultimaSecuencia ?? null,
    recuperadaDesdeHistorial: modelo.recuperadaDesdeHistorial === true,
  };
}

/*
 * `inicio` (opcional) es la respuesta de /iniciar ya mapeada:
 * `{ conversacion, pagina, ultimaSecuencia, recuperadaDesdeHistorial }`.
 * Solo se usa si es del mismo `idSesion` de la URL; si no, o tras F5, la
 * conversación se carga por GET.
 */
export function crearEstadoInicial(idSesion, inicio = null) {
  if (!esIdSesionValido(idSesion)) {
    return { ...BASE, estado: DIRECCION_INVALIDA };
  }

  const conversacion = inicio?.conversacion;
  if (!conversacion?.nodo?.idNodo || conversacion.idSesion !== idSesion) {
    return BASE;
  }

  let estado = { ...alCargar(BASE, conversacion), nodoPrecargado: true };

  if (inicio.pagina) {
    estado = {
      ...alCargarHistorial(estado, inicio.pagina),
      historialPrecargado: true,
    };
  }

  return {
    ...estado,
    ultimaSecuencia: masAlta(estado.ultimaSecuencia, inicio.ultimaSecuencia),
    recuperadaDesdeHistorial: inicio.recuperadaDesdeHistorial === true,
  };
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

// RF-31: la sesión está completada si el backend lo dice o si el nodo
// actual es terminal (no admite respuesta).
export const esSesionCompletada = (conversacion) =>
  conversacion?.estadoSesion === ESTADO_SESION.COMPLETADA ||
  conversacion?.nodo?.esTerminal === true;

// RF-31: con la sesión completada solo entra el nodo final (sin nodo a la
// vista, el backend lo da por completado o terminal) o la recarga del
// mismo nodo ya mostrado.
const aceptaNodoTrasCompletar = (state, conversacion) =>
  state.conversacion
    ? state.conversacion.nodo.idNodo === conversacion?.nodo?.idNodo
    : esSesionCompletada(conversacion);

const estadoTrasCarga = (state, conversacion) => {
  if (esSesionCompletada(conversacion)) return COMPLETADA;
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
    ...SIN_RECHAZOS,
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
    ...SIN_RECHAZOS,
    recuperacionUsada: false,
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
    // CA-29-6: el destino no se calcula; se pide a RF-26. RF-25: también al
    // completar, para mostrar el contenido del nodo final antes del cierre.
    recarga: state.recarga + 1,
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
// Una página tardía, anterior a la última secuencia confirmada (p. ej. el
// historial inicial llega después de responder), no borra lo avanzado:
// se antepone sin duplicar.
function alCargarHistorial(state, pagina) {
  const tardia =
    state.ultimaSecuencia !== null &&
    Number.isInteger(pagina.ultimaSecuencia) &&
    pagina.ultimaSecuencia < state.ultimaSecuencia;

  return {
    ...state,
    historial: tardia
      ? anteponerSinDuplicar(pagina.items, state.historial)
      : pagina.items,
    historialEstado: ESTADO_HISTORIAL.LISTO,
    historialError: null,
    hayMas: pagina.hayMas,
    secuenciaMinima: pagina.secuenciaMinima,
    errorAnteriores: null,
    ultimaSecuencia: masAlta(state.ultimaSecuencia, pagina.ultimaSecuencia),
  };
}

// RF-37: un 400 de validación cuenta una vez por `id_interaccion`. Los
// errores de red, los 409 y los 5xx no pasan por aquí.
function contarRechazo(state, error) {
  const id = state.envio?.cuerpo?.id_interaccion ?? null;

  if (error?.status !== 400 || id === null || id === state.ultimoRechazo) {
    return {};
  }

  return {
    rechazosValidacion: state.rechazosValidacion + 1,
    ultimoRechazo: id,
  };
}

// CA-27-9 y CA-30-4: se descarta la respuesta y se piden el nodo actual y
// el historial. El nodo viejo no pasa al hilo: el historial del servidor
// dice qué se respondió de verdad.
const resincronizar = (state, error) => ({
  ...state,
  estado: AVANZANDO,
  conversacion: null,
  envio: null,
  aviso: error,
  recarga: state.recarga + 1,
  historialEstado: ESTADO_HISTORIAL.CARGANDO,
  recargaHistorial: state.recargaHistorial + 1,
});

// RF-37: se descarta la respuesta (no se repite) y se pide /iniciar. El
// mensaje del backend queda como aviso informativo sobre el estado nuevo.
const recuperar = (state, error) => ({
  ...state,
  estado: RECUPERANDO,
  conversacion: null,
  envio: null,
  errorEnvio: null,
  error: null,
  aviso: error,
  recuperacion: state.recuperacion + 1,
  recuperacionUsada: true,
});

function alFallarEnvio(state, error) {
  switch (clasificarErrorEnvio(error)) {
    // CA-28-1 a CA-28-5: mismo nodo, respuesta editable y, al corregir,
    // idRespuesta nuevo.
    case ACCION_ERROR_ENVIO.INLINE:
      return {
        ...state,
        ...contarRechazo(state, error),
        estado: LISTO,
        envio: null,
        errorEnvio: error,
      };

    case ACCION_ERROR_ENVIO.DESACTUALIZADO:
      return resincronizar(state, error);

    // RF-37: una recuperación automática por episodio. Si ya se usó, un
    // nodo desactualizado se resincroniza por GET y un estado inconsistente
    // se muestra con la opción de volver al chat; nunca hay bucle.
    case ACCION_ERROR_ENVIO.RECUPERAR:
      if (!state.recuperacionUsada) return recuperar(state, error);
      if (error?.codigo === 'NODO_DESACTUALIZADO') {
        return resincronizar(state, error);
      }
      return { ...state, estado: ERROR_ENVIO, envio: null, errorEnvio: error };

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
        ...(state.historialPendiente && {
          historialPendiente: false,
          historialEstado: ESTADO_HISTORIAL.CARGANDO,
          recargaHistorial: state.recargaHistorial + 1,
        }),
      };

    case 'EXITO':
      // RF-31 (CA-31-4): tras completar se acepta el nodo final que pidió el
      // envío, y la recarga de recursos de ese mismo nodo. Una respuesta
      // tardía del nodo anterior (activo, no terminal) no lo repone (D8).
      if (
        state.estado === COMPLETADA &&
        !aceptaNodoTrasCompletar(state, action.conversacion)
      ) {
        return state;
      }

      return alCargar(state, action.conversacion);

    case 'ERROR':
      // D7: si falla la recarga, el nodo sigue visible con sus avisos.
      if (state.recargando) return { ...state, recargando: false };

      // RF-37: un estado inconsistente al consultar la conversación se
      // recupera con /iniciar, una sola vez.
      if (
        CODIGOS_RECUPERAR.includes(action.error?.codigo) &&
        !state.recuperacionUsada
      ) {
        return recuperar(state, action.error);
      }

      return { ...state, estado: ERROR, error: action.error };

    // RF-37 con RF-32: el último estado válido que entregó /iniciar
    // reemplaza el hilo (el historial del servidor manda) y la secuencia.
    // El cliente no decide cuál era el nodo válido.
    case 'RECUPERACION_EXITO':
      if (state.estado !== RECUPERANDO) return state;

      return alRecuperar(state, action.inicio);

    // La recuperación falló: se muestra el error del backend. «Reintentar»
    // consulta por GET; /iniciar no se vuelve a pedir automáticamente.
    case 'RECUPERACION_ERROR':
      if (state.estado !== RECUPERANDO) return state;

      return {
        ...state,
        estado: ERROR,
        error: action.error,
        historialPendiente: true,
      };

    // RF-37: «Pedir ayuda» tras tres rechazos.
    case 'PEDIR_AYUDA':
      return { ...state, ayudaSolicitada: true };

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

function alRecuperar(state, inicio) {
  if (!inicio?.conversacion?.nodo?.idNodo) {
    return { ...state, estado: ERROR, historialPendiente: true };
  }

  const base = {
    ...state,
    ...SIN_RECHAZOS,
    estado: AVANZANDO,
    conversacion: null,
    error: null,
    historial: [],
    hayMas: false,
    secuenciaMinima: null,
    cargandoAnteriores: false,
    errorAnteriores: null,
    ultimaSecuencia: null,
    paso: state.paso + 1,
    reintentoUsado: false,
    recargando: false,
    fallidos: [],
    envio: null,
    errorEnvio: null,
  };
  let recuperado = alCargar(base, inicio.conversacion);

  recuperado = inicio.pagina
    ? alCargarHistorial(recuperado, inicio.pagina)
    : {
        ...recuperado,
        historialEstado: ESTADO_HISTORIAL.CARGANDO,
        recargaHistorial: recuperado.recargaHistorial + 1,
      };

  return {
    ...recuperado,
    ultimaSecuencia: masAlta(
      recuperado.ultimaSecuencia,
      inicio.ultimaSecuencia,
    ),
    recuperadaDesdeHistorial: inicio.recuperadaDesdeHistorial === true,
    pasoRecuperada: recuperado.paso,
  };
}

// RF-37: tras tres rechazos en el nodo, con el formulario a la vista.
export const selectMostrarDificultad = (state) =>
  state.rechazosValidacion >= UMBRAL_RECHAZOS_VALIDACION &&
  selectNodoFormulario(state) !== null;

// RF-33 / RF-37: algún recurso del nodo quedó sin mostrarse tras el único
// reintento.
export const selectHayRecursoNoDisponible = (state) =>
  state.reintentoUsado && !state.recargando && state.fallidos.length > 0;

// Items del hilo: el historial y, al final, el nodo actual.
// RF-24/RF-22: el nodo actual aún no se habilita en el cronograma.
const enEspera = (state) =>
  state.conversacion?.nodo?.disponibilidad?.habilitado === false;

export function selectItems(state) {
  // Un nodo en espera no tiene contenido que pintar en el hilo.
  if (!state.conversacion || enEspera(state)) return state.historial;

  return [...state.historial, { ...itemNodo(state), actual: true }];
}

// D9: con la sesión completada o mientras se carga, no hay formulario.
export function selectNodoFormulario(state) {
  return state.conversacion &&
    !enEspera(state) &&
    CON_FORMULARIO.includes(state.estado)
    ? state.conversacion.nodo
    : null;
}

// RF-24/RF-22: datos de la espera (o null si el nodo ya está habilitado).
export function selectEspera(state) {
  return enEspera(state)
    ? { habilitaAprox: state.conversacion.nodo.disponibilidad.habilitaAprox }
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
