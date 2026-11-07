import { CHAT_CLIENT_ERROR } from '../api/chatApiUtils.js';
import { CHAT_ERROR_CODE } from '../types/chatErrorCodes.js';

const MENSAJE_SIN_CONEXION =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const MENSAJE_GENERICO =
  'No fue posible iniciar tu sesión de chat. Inténtalo de nuevo.';

// Contrato 3: respuesta del backend → modelo de la interfaz.
// `tipo_dependencia` y `tipo_craving` se descartan a propósito: el perfil
// clínico nunca se muestra ni se conserva en el cliente (RF-24B / RF-26B).
export function mapInicioSesion(data) {
  const { sesion, nodo_actual: nodo, ubicacion_temporal: ubicacion } = data;

  return Object.freeze({
    reanudada: data.reanudada === true,
    sesion: Object.freeze({
      idSesion: sesion.id_sesion,
      modalidadActiva: sesion.modalidad_activa,
      estadoActual: sesion.estado_actual,
      fechaInicio: sesion.fecha_inicio,
      fechaUltimaInteraccion: sesion.fecha_ultima_interaccion,
    }),
    nodoActual: Object.freeze({
      idNodo: nodo.id_nodo,
      tipoNodo: nodo.tipo_nodo,
      esNodoInicial: nodo.es_nodo_inicial === true,
      orden: nodo.orden,
      // Se conserva intacto: el texto no se modifica (RF-26).
      contenido: nodo.contenido,
    }),
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
