import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  ALMACEN,
  BRISA_CHAT_DB,
  INDICE_COLA,
  abrirBrisaChatDb,
  cerrarBrisaChatDb,
} from './brisaChatDb.js';
import { CHAT_STORAGE_ERROR } from './chatStorageError.js';
import { reiniciarIndexedDb } from './entornoPruebas.js';
import { ESCRITURA, ejecutarTransaccion, pedir } from './transaccion.js';

beforeEach(reiniciarIndexedDb);
afterEach(cerrarBrisaChatDb);

describe('esquema de brisa-chat v1', () => {
  it('crea la base con su nombre, versión y los cuatro almacenes', async () => {
    const db = await abrirBrisaChatDb();

    expect(db.name).toBe('brisa-chat');
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames].sort()).toEqual([
      'cola_interacciones',
      'paquetes',
      'recursos',
      'sesiones_locales',
    ]);
    expect(BRISA_CHAT_DB).toEqual({ NOMBRE: 'brisa-chat', VERSION: 1 });
  });

  it('cada almacén usa la clave del contrato', async () => {
    const db = await abrirBrisaChatDb();
    const tx = db.transaction(Object.values(ALMACEN));

    expect(tx.objectStore('paquetes').keyPath).toBe('id_sesion');
    expect(tx.objectStore('recursos').keyPath).toBe('id_recurso');
    expect(tx.objectStore('sesiones_locales').keyPath).toBe('id_sesion');
    expect(tx.objectStore('cola_interacciones').keyPath).toBe('id_interaccion');
  });

  it('la cola tiene el índice único [id_sesion, secuencia] y los de usuario y estado', async () => {
    const db = await abrirBrisaChatDb();
    const cola = db
      .transaction('cola_interacciones')
      .objectStore('cola_interacciones');
    const compuesto = cola.index(INDICE_COLA.SESION_SECUENCIA);

    expect([...cola.indexNames].sort()).toEqual([
      'estado_sincronizacion',
      'id_sesion+secuencia',
      'id_usuario',
    ]);
    expect(compuesto.keyPath).toEqual(['id_sesion', 'secuencia']);
    expect(compuesto.unique).toBe(true);
    expect(cola.index(INDICE_COLA.USUARIO).unique).toBe(false);
    expect(cola.index(INDICE_COLA.ESTADO_SINCRONIZACION).unique).toBe(false);
  });

  it('reutiliza una sola conexión', async () => {
    expect(await abrirBrisaChatDb()).toBe(await abrirBrisaChatDb());
  });
});

describe('sin IndexedDB', () => {
  it('falla con ALMACENAMIENTO_NO_DISPONIBLE y no deja el fallo en caché', async () => {
    const original = globalThis.indexedDB;
    globalThis.indexedDB = undefined;

    await expect(abrirBrisaChatDb()).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.ALMACENAMIENTO_NO_DISPONIBLE,
    });

    globalThis.indexedDB = original;
    await expect(abrirBrisaChatDb()).resolves.toBeDefined();
  });
});

describe('transacciones', () => {
  it('resuelve cuando la transacción terminó: lo escrito ya se puede leer', async () => {
    await ejecutarTransaccion([ALMACEN.RECURSOS], ESCRITURA, (tx) =>
      pedir(tx.objectStore(ALMACEN.RECURSOS).put({ id_recurso: 'r-1' })),
    );

    const db = await abrirBrisaChatDb();
    const leido = await pedir(
      db.transaction(ALMACEN.RECURSOS).objectStore(ALMACEN.RECURSOS).get('r-1'),
    );
    expect(leido).toEqual({ id_recurso: 'r-1' });
  });

  it('si el trabajo falla después de escribir, revierte todo y propaga el error', async () => {
    const propio = new Error('fallo ficticio');

    await expect(
      ejecutarTransaccion(
        [ALMACEN.RECURSOS, ALMACEN.PAQUETES],
        ESCRITURA,
        async (tx) => {
          await pedir(
            tx.objectStore(ALMACEN.RECURSOS).put({ id_recurso: 'r-1' }),
          );
          await pedir(
            tx.objectStore(ALMACEN.PAQUETES).put({ id_sesion: 's-1' }),
          );
          throw propio;
        },
      ),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.ESCRITURA_FALLIDA,
      cause: propio,
    });

    const db = await abrirBrisaChatDb();
    const tx = db.transaction([ALMACEN.RECURSOS, ALMACEN.PAQUETES]);
    expect(await pedir(tx.objectStore(ALMACEN.RECURSOS).count())).toBe(0);
    expect(await pedir(tx.objectStore(ALMACEN.PAQUETES).count())).toBe(0);
  });
});
