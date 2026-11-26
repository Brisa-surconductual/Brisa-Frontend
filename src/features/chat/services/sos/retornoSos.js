import { iniciarSesionConversacional } from '../../api/sesion/iniciarSesionConversacional.js';
import { MODULO_ORIGEN_SOS } from '../../types/sos.js';
import { mapInicioSesion } from '../sesionConversacional.js';

import { contextoRetornoSeguro } from './contextoOrigenSos.js';

export const STUDENT_HOME_PATH = '/app/estudiante';
export const CHAT_SESSION_PATH = '/app/estudiante/chat/sesion';

export const TIPO_RETORNO_SOS = Object.freeze({
  // Había una sesión de terapia y el estudiante venía del chat: se retoma
  // con POST /chat/sesiones/iniciar (RF-32).
  REANUDAR_CHAT: 'REANUDAR_CHAT',
  // Ruta interna validada del área del estudiante.
  RUTA: 'RUTA',
});

/*
 * RF-43: a dónde vuelve el estudiante. Manda lo que devolvió el backend al
 * finalizar (`contexto_retorno`, `sesion_pausada`); si no llegó (cierre
 * fallido o estado desconocido), lo que se conoce de la activación. Toda
 * ruta se valida: nunca una URL externa ni de otra área.
 *
 * Desde otro módulo se restaura su ruta; la sesión pausada queda en pausa
 * y RF-32 la retoma cuando el estudiante vuelva al chat.
 */
export function decidirRetornoSos({
  resultado = null,
  intervencion = null,
  contexto = null,
} = {}) {
  const retorno =
    contextoRetornoSeguro(resultado?.contextoRetorno) ??
    contextoRetornoSeguro(contexto);
  const pausada =
    resultado?.sesionPausada ?? intervencion?.sesionPausada ?? null;

  if (pausada && retorno?.modulo === MODULO_ORIGEN_SOS.CHAT) {
    return Object.freeze({
      tipo: TIPO_RETORNO_SOS.REANUDAR_CHAT,
      idSesion: pausada.idSesion,
      idNodo: pausada.idNodoActual ?? null,
    });
  }

  return Object.freeze({
    tipo: TIPO_RETORNO_SOS.RUTA,
    ruta: retorno?.ruta ?? STUDENT_HOME_PATH,
  });
}

// RF-32: /iniciar debe devolver la misma sesión y, si se conoce, el mismo
// nodo en que quedó pausada.
export function verificarReanudacion(modelo, { idSesion, idNodo }) {
  const mismaSesion = modelo?.sesion?.idSesion === idSesion;
  const mismoNodo =
    idNodo === null || modelo?.conversacion?.nodo?.idNodo === idNodo;

  return Object.freeze({
    mismaSesion,
    mismoNodo,
    exacta: mismaSesion && mismoNodo,
  });
}

/*
 * RF-32: retoma la sesión pausada con POST /chat/sesiones/iniciar (la
 * lógica de reanudación es la del backend; aquí no se crea nada) y
 * comprueba el resultado. Si /iniciar falla, el error sube tal cual.
 */
export async function reanudarSesionPausada(
  decision,
  { iniciar = iniciarSesionConversacional, mapear = mapInicioSesion } = {},
) {
  const modelo = mapear(await iniciar());

  return Object.freeze({
    modelo,
    destino: `${CHAT_SESSION_PATH}/${modelo.sesion.idSesion}`,
    ...verificarReanudacion(modelo, decision),
  });
}
