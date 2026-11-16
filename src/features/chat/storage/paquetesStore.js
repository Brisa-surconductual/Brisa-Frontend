import { ESTADO_PRECARGA } from '../types/estadosChat.js';
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
  esEnteroPositivo,
  esTexto,
  exigir,
  exigirUsuario,
} from './validacionRegistro.js';

const { PAQUETES } = ALMACEN;

/*
 * Almacén `paquetes` (clave `id_sesion`). Lo escribe la precarga
 * (tarea 2) y lo lee la conversación sin conexión (tarea 3). Solo se
 * guardan los campos del contrato; los nodos se conservan tal como los
 * entrega el paquete offline (contrato 5a), sin transformarlos.
 */
function aRegistro(paquete, ahora) {
  exigir(paquete !== null && typeof paquete === 'object');

  const registro = {
    id_sesion: paquete.id_sesion,
    id_usuario: paquete.id_usuario,
    id_flujo_conversacional: paquete.id_flujo_conversacional,
    version_arbol: paquete.version_arbol,
    etag: paquete.etag,
    nodos: paquete.nodos,
    estado_precarga: paquete.estado_precarga,
    descargado_en: paquete.descargado_en ?? capturadaEn(ahora),
  };

  exigir(esTexto(registro.id_sesion));
  exigirUsuario(registro.id_usuario);
  exigir(esTexto(registro.id_flujo_conversacional));
  exigir(esEnteroPositivo(registro.version_arbol));
  exigir(esTexto(registro.etag));
  exigir(Array.isArray(registro.nodos));
  exigir(esDeCatalogo(ESTADO_PRECARGA, registro.estado_precarga));
  exigir(esTexto(registro.descargado_en));

  return registro;
}

// Crea o reemplaza el paquete de una sesión. Un paquete de la misma
// sesión guardado por otro usuario no se sobrescribe.
export async function guardarPaquete(paquete, { ahora = new Date() } = {}) {
  const registro = aRegistro(paquete, ahora);

  return ejecutarTransaccion([PAQUETES], ESCRITURA, async (tx) => {
    const almacen = tx.objectStore(PAQUETES);
    const existente = await pedir(almacen.get(registro.id_sesion));

    if (existente && existente.id_usuario !== registro.id_usuario) {
      throw createChatStorageError(CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE);
    }

    await pedir(almacen.put(registro));
    return registro;
  });
}

// El paquete solo se entrega a su usuario: si es de otro, no existe.
export async function obtenerPaquete(idSesion, idUsuario) {
  exigir(esTexto(idSesion));
  exigirUsuario(idUsuario);

  const paquete = await ejecutarTransaccion([PAQUETES], LECTURA, (tx) =>
    pedir(tx.objectStore(PAQUETES).get(idSesion)),
  );

  return paquete && paquete.id_usuario === idUsuario ? paquete : null;
}

// ETag para el `If-None-Match` de la precarga; null si no hay paquete.
export async function obtenerEtagPaquete(idSesion, idUsuario) {
  const paquete = await obtenerPaquete(idSesion, idUsuario);
  return paquete?.etag ?? null;
}
