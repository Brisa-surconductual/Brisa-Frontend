import { ESTADO_SESION_OFFLINE } from '../types/estadosChat.js';
import { capturadaEn } from '../utils/capturadaEn.js';

import { ALMACEN } from './brisaChatDb.js';
import {
  CHAT_STORAGE_ERROR,
  createChatStorageError,
} from './chatStorageError.js';
import {
  ESCRITURA,
  LECTURA,
  ejecutarTransaccion,
  pedir,
} from './transaccion.js';
import {
  esDeCatalogo,
  esEnteroNoNegativo,
  esTexto,
  exigir,
  exigirUsuario,
} from './validacionRegistro.js';

const { SESIONES_LOCALES } = ALMACEN;

/*
 * Almacén `sesiones_locales` (clave `id_sesion`): el punto en que va
 * cada sesión en el dispositivo. Se conserva al cerrar sesión (D5).
 *
 * `ultima_secuencia` es la última secuencia confirmada de la sesión. Se
 * admite null cuando no se conoce (p. ej. una sesión reanudada que ya
 * tuvo respuestas en línea): en ese caso no se puede encolar, porque la
 * secuencia no se inventa. Solo el encolado la incrementa.
 */
export async function leerSesionPropia(almacen, idSesion, idUsuario) {
  const sesion = await pedir(almacen.get(idSesion));

  if (!sesion) {
    throw createChatStorageError(CHAT_STORAGE_ERROR.SESION_LOCAL_NO_ENCONTRADA);
  }
  if (sesion.id_usuario !== idUsuario) {
    throw createChatStorageError(CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE);
  }

  return sesion;
}

const secuenciaValida = (valor) => valor === null || esEnteroNoNegativo(valor);

// Crea la sesión local o actualiza la existente del mismo usuario. La
// secuencia nunca retrocede y una conocida no se pierde con un null.
export async function guardarSesionLocal(sesion, { ahora = new Date() } = {}) {
  exigir(sesion !== null && typeof sesion === 'object');
  exigir(esTexto(sesion.id_sesion));
  exigirUsuario(sesion.id_usuario);
  exigir(esTexto(sesion.id_nodo_actual));
  exigir(secuenciaValida(sesion.ultima_secuencia ?? null));
  exigir(esDeCatalogo(ESTADO_SESION_OFFLINE, sesion.estado_sesion_offline));

  return ejecutarTransaccion([SESIONES_LOCALES], ESCRITURA, async (tx) => {
    const almacen = tx.objectStore(SESIONES_LOCALES);
    const existente = await pedir(almacen.get(sesion.id_sesion));

    if (existente && existente.id_usuario !== sesion.id_usuario) {
      throw createChatStorageError(CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE);
    }

    const anterior = existente?.ultima_secuencia ?? null;
    const nueva = sesion.ultima_secuencia ?? null;

    exigir(anterior === null || nueva === null || nueva >= anterior);

    const registro = {
      id_sesion: sesion.id_sesion,
      id_usuario: sesion.id_usuario,
      id_nodo_actual: sesion.id_nodo_actual,
      ultima_secuencia: nueva ?? anterior,
      estado_sesion_offline: sesion.estado_sesion_offline,
      actualizado_en: capturadaEn(ahora),
    };

    await pedir(almacen.put(registro));
    return registro;
  });
}

// null si no existe o pertenece a otro usuario.
export async function obtenerSesionLocal(idSesion, idUsuario) {
  exigir(esTexto(idSesion));
  exigirUsuario(idUsuario);

  const sesion = await ejecutarTransaccion([SESIONES_LOCALES], LECTURA, (tx) =>
    pedir(tx.objectStore(SESIONES_LOCALES).get(idSesion)),
  );

  return sesion && sesion.id_usuario === idUsuario ? sesion : null;
}

// Sesiones locales del usuario (reapertura y sincronización).
export async function listarSesionesLocales(idUsuario) {
  exigirUsuario(idUsuario);

  const todas = await ejecutarTransaccion([SESIONES_LOCALES], LECTURA, (tx) =>
    pedir(tx.objectStore(SESIONES_LOCALES).getAll()),
  );

  return todas.filter((sesion) => sesion.id_usuario === idUsuario);
}

// Cambia el nodo actual o el estado offline. La secuencia no se toca
// aquí: solo avanza al encolar.
export async function actualizarSesionLocal(
  idSesion,
  idUsuario,
  cambios,
  { ahora = new Date() } = {},
) {
  exigir(esTexto(idSesion));
  exigirUsuario(idUsuario);
  exigir(cambios !== null && typeof cambios === 'object');

  const { id_nodo_actual: idNodo, estado_sesion_offline: estado } = cambios;

  exigir(idNodo === undefined || esTexto(idNodo));
  exigir(estado === undefined || esDeCatalogo(ESTADO_SESION_OFFLINE, estado));

  return ejecutarTransaccion([SESIONES_LOCALES], ESCRITURA, async (tx) => {
    const almacen = tx.objectStore(SESIONES_LOCALES);
    const sesion = await leerSesionPropia(almacen, idSesion, idUsuario);
    const registro = {
      ...sesion,
      id_nodo_actual: idNodo ?? sesion.id_nodo_actual,
      estado_sesion_offline: estado ?? sesion.estado_sesion_offline,
      actualizado_en: capturadaEn(ahora),
    };

    await pedir(almacen.put(registro));
    return registro;
  });
}
