import {
  CHAT_STORAGE_ERROR,
  createChatStorageError,
} from './chatStorageError.js';

/*
 * Único punto que crea y abre la base IndexedDB del chat (Etapa 3,
 * tarea 3). El esquema es el del contrato: base `brisa-chat`, versión 1,
 * cuatro almacenes. Nadie más abre ni migra esta base: la precarga
 * (tarea 2) guarda paquetes y recursos con los servicios de este módulo.
 */
export const BRISA_CHAT_DB = Object.freeze({
  NOMBRE: 'brisa-chat',
  VERSION: 1,
});

export const ALMACEN = Object.freeze({
  PAQUETES: 'paquetes',
  RECURSOS: 'recursos',
  SESIONES_LOCALES: 'sesiones_locales',
  COLA_INTERACCIONES: 'cola_interacciones',
});

// Índices de `cola_interacciones`. El compuesto es único: dos
// interacciones de una sesión nunca comparten secuencia.
export const INDICE_COLA = Object.freeze({
  SESION_SECUENCIA: 'id_sesion+secuencia',
  USUARIO: 'id_usuario',
  ESTADO_SINCRONIZACION: 'estado_sincronizacion',
});

function crearEsquema(db) {
  db.createObjectStore(ALMACEN.PAQUETES, { keyPath: 'id_sesion' });
  db.createObjectStore(ALMACEN.RECURSOS, { keyPath: 'id_recurso' });
  db.createObjectStore(ALMACEN.SESIONES_LOCALES, { keyPath: 'id_sesion' });

  const cola = db.createObjectStore(ALMACEN.COLA_INTERACCIONES, {
    keyPath: 'id_interaccion',
  });
  cola.createIndex(INDICE_COLA.SESION_SECUENCIA, ['id_sesion', 'secuencia'], {
    unique: true,
  });
  cola.createIndex(INDICE_COLA.USUARIO, 'id_usuario');
  cola.createIndex(INDICE_COLA.ESTADO_SINCRONIZACION, 'estado_sincronizacion');
}

// Conexión compartida: se abre una vez por pestaña.
let conexion = null;

function abrir() {
  return new Promise((resolve, reject) => {
    const factory = globalThis.indexedDB;

    if (!factory) {
      reject(
        createChatStorageError(CHAT_STORAGE_ERROR.ALMACENAMIENTO_NO_DISPONIBLE),
      );
      return;
    }

    let solicitud;
    try {
      solicitud = factory.open(BRISA_CHAT_DB.NOMBRE, BRISA_CHAT_DB.VERSION);
    } catch (error) {
      reject(
        createChatStorageError(
          CHAT_STORAGE_ERROR.ALMACENAMIENTO_NO_DISPONIBLE,
          error,
        ),
      );
      return;
    }

    // Versión 1: la base se crea desde cero. Una versión futura agrega
    // aquí su migración según `oldVersion`.
    solicitud.onupgradeneeded = (event) => {
      if (event.oldVersion < 1) crearEsquema(solicitud.result);
    };

    solicitud.onsuccess = () => {
      const db = solicitud.result;
      // Otra pestaña con una versión nueva: se cede la base y la próxima
      // operación vuelve a abrirla.
      db.onversionchange = () => {
        db.close();
        conexion = null;
      };
      resolve(db);
    };

    solicitud.onerror = () =>
      reject(
        createChatStorageError(
          CHAT_STORAGE_ERROR.ALMACENAMIENTO_NO_DISPONIBLE,
          solicitud.error,
        ),
      );
    solicitud.onblocked = () =>
      reject(
        createChatStorageError(CHAT_STORAGE_ERROR.ALMACENAMIENTO_NO_DISPONIBLE),
      );
  });
}

export function abrirBrisaChatDb() {
  if (!conexion) {
    conexion = abrir().catch((error) => {
      // Un fallo no queda en caché: la próxima operación lo reintenta.
      conexion = null;
      throw error;
    });
  }

  return conexion;
}

// Cierra la conexión compartida (pruebas y cambios de versión).
export async function cerrarBrisaChatDb() {
  const pendiente = conexion;
  conexion = null;

  if (!pendiente) return;

  try {
    (await pendiente).close();
  } catch {
    // Si no llegó a abrirse no hay nada que cerrar.
  }
}
