import { CHAT_CLIENT_ERROR } from '../api/chatApiUtils.js';
import { CHAT_ERROR_CODE } from '../types/chatErrorCodes.js';
import { ESTADO_SESION } from '../types/estadosChat.js';

import { mapNodoActual } from './nodoActual.js';

const MENSAJE_SIN_CONEXION =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const MENSAJE_GENERICO =
  'No fue posible iniciar tu sesión de chat. Inténtalo de nuevo.';

// RF-32: `recuperada_desde_historial`. Aviso de interfaz, no clínico.
export const MENSAJE_RECUPERADA_DESDE_HISTORIAL =
  'BRISA recuperó el último punto válido de tu conversación.';

// RF-32: `nodo_actual` de /iniciar (snake_case) al mismo modelo que da
// RF-26 (`mapNodoActual`). El nodo lo eligió el backend: no se toca.
// Otros campos (p. ej. `disponibilidad`) se toleran y no pasan.
const conversacionDeInicio = (sesion, nodo) =>
  mapNodoActual({
    idSesion: sesion.id_sesion,
    estadoSesion: sesion.estado_actual,
    nodo: {
      idNodo: nodo.id_nodo,
      tipoNodo: nodo.tipo_nodo,
      orden: nodo.orden ?? null,
      esTerminal: nodo.es_terminal,
      bloques: nodo.bloques,
      entrada: nodo.entrada,
    },
  });

// RF-32: `historial_reciente` tiene la forma de la página del GET del
// historial; se conserva con esas claves para mapearla con `mapHistorial`,
// igual que la página que llega por GET. Sin `items` no hay página.
function paginaDeInicio(historial) {
  if (!Array.isArray(historial?.items)) return null;

  return Object.freeze({
    items: Object.freeze([...historial.items]),
    hay_mas: historial.hay_mas === true,
    siguiente_cursor: historial.siguiente_cursor ?? null,
  });
}

const enteroONull = (valor) => (Number.isInteger(valor) ? valor : null);

// Contrato 3: respuesta del backend → modelo de la interfaz.
// `tipo_dependencia` y `tipo_craving` se descartan a propósito: el perfil
// clínico nunca se muestra ni se conserva en el cliente (RF-24B / RF-26B).
export function mapInicioSesion(data) {
  const { sesion, nodo_actual: nodo, ubicacion_temporal: ubicacion } = data;

  return Object.freeze({
    reanudada: data.reanudada === true,
    // RF-32: el backend reparó el puntero desde el historial.
    recuperadaDesdeHistorial: data.recuperada_desde_historial === true,
    // El árbol vigente ya se completó: la sesión solo se consulta.
    completada: sesion.estado_actual === ESTADO_SESION.COMPLETADA,
    sesion: Object.freeze({
      idSesion: sesion.id_sesion,
      modalidadActiva: sesion.modalidad_activa,
      estadoActual: sesion.estado_actual,
      fechaInicio: sesion.fecha_inicio,
      fechaUltimaInteraccion: sesion.fecha_ultima_interaccion,
      // RF-30 / RF-32: última secuencia confirmada.
      ultimaSecuencia: enteroONull(sesion.ultima_secuencia),
    }),
    // RF-26 / RF-32: el nodo vigente con el contrato actual.
    conversacion: conversacionDeInicio(sesion, nodo),
    historialReciente: paginaDeInicio(data.historial_reciente),
    ubicacionTemporal: ubicacion
      ? Object.freeze({
          nombreUnidad: ubicacion.nombre_unidad,
          finalizadoPrograma: ubicacion.finalizado_programa === true,
        })
      : null,
  });
}

// Qué muestra y qué permite la pantalla de error.
// El `message` del backend se muestra tal cual (contrato 1.3).
export function describirErrorInicio(error) {
  const code = error?.code;
  const status = error?.status ?? null;
  const backendMessage = error?.backendMessage?.trim() ?? '';

  if (code === CHAT_CLIENT_ERROR.SIN_CONEXION) {
    return {
      mensaje: MENSAJE_SIN_CONEXION,
      reintentable: true,
      requiereLogin: false,
    };
  }

  // El guard de sesión puede responder 401 sin `codigo`.
  if (code === 'NO_AUTENTICADO' || status === 401) {
    return {
      mensaje: backendMessage || 'Debe iniciar sesión para acceder al chat.',
      reintentable: false,
      requiereLogin: true,
    };
  }

  const definicion = CHAT_ERROR_CODE[code];
  const reintentable =
    code === CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA ||
    (definicion ? definicion.reintentable : status !== null && status >= 500);

  return {
    mensaje: backendMessage || MENSAJE_GENERICO,
    reintentable,
    requiereLogin: false,
  };
}
