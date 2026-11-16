import { CHAT_CLIENT_ERROR } from '../../api/chatApiUtils.js';
import {
  CODIGO_SINCRONIZACION,
  CONFIG_SINCRONIZACION,
} from '../../types/index.js';

// Qué hace el cliente ante cada fallo del envío (tabla de la tarea 4).
export const ACCION_FALLO = Object.freeze({
  // 400: corregir el armado; el mismo lote no se reintenta solo.
  NO_REINTENTAR: 'NO_REINTENTAR',
  // 401: conservar la cola y esperar un nuevo inicio de sesión.
  ESPERAR_AUTENTICACION: 'ESPERAR_AUTENTICACION',
  // 403: renovar el token CSRF y reintentar.
  RENOVAR_CSRF: 'RENOVAR_CSRF',
  // 404: marcar las interacciones del lote como ERROR_SINCRONIZACION.
  MARCAR_ERROR: 'MARCAR_ERROR',
  // 500 o fallo desconocido: nada se confirmó; reintentar con backoff.
  REINTENTAR: 'REINTENTAR',
  // Sin respuesta: conservar la cola y reintentar con backoff.
  SIN_RESPUESTA: 'SIN_RESPUESTA',
});

const POR_CODIGO = Object.freeze({
  [CODIGO_SINCRONIZACION.LOTE_INVALIDO]: ACCION_FALLO.NO_REINTENTAR,
  [CODIGO_SINCRONIZACION.NO_AUTENTICADO]: ACCION_FALLO.ESPERAR_AUTENTICACION,
  [CODIGO_SINCRONIZACION.CSRF_INVALIDO]: ACCION_FALLO.RENOVAR_CSRF,
  [CODIGO_SINCRONIZACION.SESION_NO_ENCONTRADA]: ACCION_FALLO.MARCAR_ERROR,
  [CODIGO_SINCRONIZACION.ERROR_SINCRONIZACION]: ACCION_FALLO.REINTENTAR,
  [CHAT_CLIENT_ERROR.SIN_CONEXION]: ACCION_FALLO.SIN_RESPUESTA,
});

// Se decide por `code` (como `codigo` en línea), nunca por el mensaje.
// Un código que no está en la tabla se trata como fallo del servidor.
export function clasificarFallo(error) {
  return Object.hasOwn(POR_CODIGO, error?.code)
    ? POR_CODIGO[error.code]
    : ACCION_FALLO.REINTENTAR;
}

/*
 * Backoff exponencial: el intento fallido n (desde 1) espera
 * esperaInicialMs · 2^(n−1), con tope en esperaMaximaMs. Por defecto, de
 * 2 s a 5 min.
 */
export function calcularEsperaMs(
  intentoFallido,
  {
    esperaInicialMs = CONFIG_SINCRONIZACION.esperaInicialMs,
    esperaMaximaMs = CONFIG_SINCRONIZACION.esperaMaximaMs,
  } = {},
) {
  const n = Math.max(1, Math.floor(intentoFallido));
  return Math.min(esperaMaximaMs, esperaInicialMs * 2 ** (n - 1));
}
