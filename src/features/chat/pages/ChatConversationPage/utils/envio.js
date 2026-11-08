import { TIPO_ENTRADA } from '../../../types/index.js';
import { capturadaEn as capturadaEnAhora } from '../../../utils/capturadaEn.js';

// Tabla 2.5 del brief: qué hace la página con cada error del envío. El
// texto siempre es el `mensaje` del backend (ADR-0004).
export const ACCION_ERROR_ENVIO = Object.freeze({
  INLINE: 'INLINE',
  DESACTUALIZADO: 'DESACTUALIZADO',
  LOGIN: 'LOGIN',
  REINTENTAR: 'REINTENTAR',
  VOLVER_AL_CHAT: 'VOLVER_AL_CHAT',
  VOLVER_AL_INICIO: 'VOLVER_AL_INICIO',
});

const CODIGO = Object.freeze({
  NODO_DESACTUALIZADO: 'NODO_DESACTUALIZADO',
  TIPO_ENTRADA_NO_PERMITIDO: 'TIPO_ENTRADA_NO_PERMITIDO',
  SESION_NO_ENCONTRADA: 'SESION_NO_ENCONTRADA',
});

export function clasificarErrorEnvio(error) {
  const status = error?.status ?? null;
  const codigo = error?.codigo;

  // El 401 llega sin `codigo`: se decide por estado HTTP.
  if (status === 401) return ACCION_ERROR_ENVIO.LOGIN;
  if (codigo === CODIGO.NODO_DESACTUALIZADO) {
    return ACCION_ERROR_ENVIO.DESACTUALIZADO;
  }
  // Todo 400 es de validación salvo TIPO_ENTRADA_NO_PERMITIDO (desajuste de
  // A-014): así un código nuevo del backend no bloquea la pantalla.
  if (status === 400 && codigo !== CODIGO.TIPO_ENTRADA_NO_PERMITIDO) {
    return ACCION_ERROR_ENVIO.INLINE;
  }
  // Sin respuesta o 5xx (incluidos SIN_TRANSICION, DESTINO_INVALIDO y
  // ERROR_PERFIL): se reintenta con el mismo idRespuesta (D7).
  if (error?.reintentable === true) return ACCION_ERROR_ENVIO.REINTENTAR;
  if (status === 403 || codigo === CODIGO.SESION_NO_ENCONTRADA) {
    return ACCION_ERROR_ENVIO.VOLVER_AL_CHAT;
  }

  return ACCION_ERROR_ENVIO.VOLVER_AL_INICIO;
}

export const esNodoInformativo = (nodo) =>
  !nodo.entrada || nodo.entrada.tipo === TIPO_ENTRADA.CONTINUAR;

// D19: `crypto.randomUUID` solo existe en contexto seguro (HTTPS o
// localhost). Al probar por la IP de la red local se arma un UUID v4 con
// `getRandomValues`, que sí está en cualquier contexto.
export function nuevoIdRespuesta(c = globalThis.crypto) {
  if (typeof c.randomUUID === 'function') return c.randomUUID();

  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// D6 y D7: cada respuesta distinta lleva un idRespuesta nuevo; el
// reintento reusa este mismo objeto. CA-27-6: el nodo informativo envía
// CONTINUAR con valor null.
export function crearCuerpo(
  nodo,
  valor,
  { idRespuesta = nuevoIdRespuesta(), capturadaEn = capturadaEnAhora() } = {},
) {
  const informativo = esNodoInformativo(nodo);

  return Object.freeze({
    idRespuesta,
    idNodo: nodo.idNodo,
    tipoEntrada: informativo ? TIPO_ENTRADA.CONTINUAR : nodo.entrada.tipo,
    valor: informativo ? null : valor,
    capturadaEn,
  });
}
