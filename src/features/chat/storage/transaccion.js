import { abrirBrisaChatDb } from './brisaChatDb.js';
import {
  CHAT_STORAGE_ERROR,
  createChatStorageError,
  esChatStorageError,
} from './chatStorageError.js';

// Una solicitud de IndexedDB como promesa.
export function pedir(solicitud) {
  return new Promise((resolve, reject) => {
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

// Un error de IndexedDB pasa a un código propio; los del almacenamiento
// se conservan. ConstraintError = clave o índice único ocupado.
function aErrorDeAlmacenamiento(error) {
  if (esChatStorageError(error)) return error;

  return createChatStorageError(
    error?.name === 'ConstraintError'
      ? CHAT_STORAGE_ERROR.INTERACCION_EN_CONFLICTO
      : CHAT_STORAGE_ERROR.ESCRITURA_FALLIDA,
    error,
  );
}

/*
 * Ejecuta `trabajo(tx)` en una sola transacción. Resuelve solo cuando la
 * transacción terminó (`complete`): hasta entonces nada está guardado.
 * Si el trabajo falla o lanza, la transacción se aborta y ninguno de sus
 * cambios queda escrito.
 *
 * `trabajo` solo debe esperar solicitudes de esta misma transacción
 * (`pedir`): esperar otra cosa la cerraría antes de tiempo.
 */
export async function ejecutarTransaccion(almacenes, modo, trabajo) {
  const db = await abrirBrisaChatDb();

  return new Promise((resolve, reject) => {
    let tx;

    try {
      tx = db.transaction(almacenes, modo);
    } catch (error) {
      reject(aErrorDeAlmacenamiento(error));
      return;
    }

    let fallo = null;
    let promesaTrabajo;

    try {
      promesaTrabajo = Promise.resolve(trabajo(tx));
    } catch (error) {
      promesaTrabajo = Promise.reject(error);
    }

    promesaTrabajo.catch((error) => {
      fallo = error;
      try {
        tx.abort();
      } catch {
        // Ya estaba abortándose (p. ej. por la solicitud que falló).
      }
    });

    tx.oncomplete = () => {
      promesaTrabajo.then(resolve, (error) =>
        reject(aErrorDeAlmacenamiento(error)),
      );
    };
    tx.onabort = () => reject(aErrorDeAlmacenamiento(fallo ?? tx.error));
  });
}

export const LECTURA = 'readonly';
export const ESCRITURA = 'readwrite';
