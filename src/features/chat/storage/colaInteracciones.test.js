import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ALMACEN, abrirBrisaChatDb, cerrarBrisaChatDb } from './brisaChatDb.js';
import { CHAT_STORAGE_ERROR } from './chatStorageError.js';
import {
  actualizarEstadoSincronizacion,
  eliminarInteraccionesConfirmadas,
  encolarInteraccion,
  listarColaSesion,
  listarPendientesSesion,
  listarSesionesConPendientes,
  tienePendientes,
} from './colaInteraccionesStore.js';
import {
  SESION_1,
  SESION_2,
  USUARIO_A,
  USUARIO_B,
  interaccion,
  reiniciarIndexedDb,
  sesionLocal,
} from './entornoPruebas.js';
import {
  guardarSesionLocal,
  obtenerSesionLocal,
} from './sesionesLocalesStore.js';
import { ESCRITURA, ejecutarTransaccion, pedir } from './transaccion.js';

beforeEach(reiniciarIndexedDb);
afterEach(cerrarBrisaChatDb);

const secuencias = (lista) => lista.map((i) => i.secuencia);

// Estado completo de la base, para comprobar que un fallo no cambió nada.
async function instantanea() {
  const db = await abrirBrisaChatDb();
  const tx = db.transaction([
    ALMACEN.SESIONES_LOCALES,
    ALMACEN.COLA_INTERACCIONES,
  ]);

  return {
    sesiones: await pedir(tx.objectStore(ALMACEN.SESIONES_LOCALES).getAll()),
    cola: await pedir(tx.objectStore(ALMACEN.COLA_INTERACCIONES).getAll()),
  };
}

describe('encolar: secuencia y sesión en la misma transacción', () => {
  it('asigna secuencias consecutivas desde la última confirmada', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: 41 }));

    const primera = await encolarInteraccion(
      interaccion({ id_nodo_destino_local: 'nodo-2' }),
    );
    const segunda = await encolarInteraccion(
      interaccion({ id_nodo: 'nodo-2', id_nodo_destino_local: 'nodo-3' }),
    );

    expect([primera.secuencia, segunda.secuencia]).toEqual([42, 43]);
    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toMatchObject({
      ultima_secuencia: 43,
      id_nodo_actual: 'nodo-3',
    });
  });

  it('guarda la interacción con el estado inicial del contrato', async () => {
    await guardarSesionLocal(sesionLocal());
    const datos = interaccion({
      recursos_no_presentados: ['recurso-ficticio'],
    });
    await encolarInteraccion(datos);

    expect((await listarColaSesion(SESION_1, USUARIO_A))[0]).toEqual({
      ...datos,
      secuencia: 1,
      estado_sincronizacion: 'PENDIENTE_SINCRONIZACION',
      intentos: 0,
      ultimo_error: null,
    });
  });

  it('sin destino local conserva el nodo actual; aplica el estado offline pedido', async () => {
    await guardarSesionLocal(sesionLocal());
    await encolarInteraccion(interaccion({ id_nodo_destino_local: null }), {
      estado_sesion_offline: 'COMPLETADA',
    });

    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toMatchObject({
      id_nodo_actual: 'nodo-1',
      estado_sesion_offline: 'COMPLETADA',
      ultima_secuencia: 1,
    });
  });

  it('encolados simultáneos no repiten ni saltan secuencias', async () => {
    await guardarSesionLocal(sesionLocal());

    await Promise.all(
      Array.from({ length: 8 }, () => encolarInteraccion(interaccion())),
    );

    expect(secuencias(await listarColaSesion(SESION_1, USUARIO_A))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(
      (await obtenerSesionLocal(SESION_1, USUARIO_A)).ultima_secuencia,
    ).toBe(8);
  });
});

describe('encolar: rollback, nada cambia si falla', () => {
  it('secuencia desconocida: no inventa una', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: null }));
    const antes = await instantanea();

    await expect(encolarInteraccion(interaccion())).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.SECUENCIA_NO_DETERMINADA,
    });
    expect(await instantanea()).toEqual(antes);
  });

  it('id_interaccion repetido: conflicto y ni la secuencia ni el nodo avanzan', async () => {
    await guardarSesionLocal(sesionLocal());
    const primera = await encolarInteraccion(interaccion());
    const antes = await instantanea();

    await expect(
      encolarInteraccion(
        interaccion({
          id_interaccion: primera.id_interaccion,
          id_nodo_destino_local: 'nodo-9',
        }),
      ),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.INTERACCION_EN_CONFLICTO,
    });
    expect(await instantanea()).toEqual(antes);
  });

  it('secuencia ya ocupada en la sesión (índice único): conflicto y rollback', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: 0 }));
    // Una interacción con la secuencia 1 que la sesión no registra.
    await ejecutarTransaccion([ALMACEN.COLA_INTERACCIONES], ESCRITURA, (tx) =>
      pedir(
        tx
          .objectStore(ALMACEN.COLA_INTERACCIONES)
          .add({ ...interaccion(), secuencia: 1 }),
      ),
    );
    const antes = await instantanea();

    await expect(encolarInteraccion(interaccion())).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.INTERACCION_EN_CONFLICTO,
    });
    expect(await instantanea()).toEqual(antes);
  });

  it.each([
    [
      'sesión inexistente',
      () => interaccion({ id_sesion: SESION_2 }),
      CHAT_STORAGE_ERROR.SESION_LOCAL_NO_ENCONTRADA,
    ],
    [
      'sesión de otro usuario',
      () => interaccion({ id_usuario: USUARIO_B }),
      CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE,
    ],
    [
      'id_interaccion que no es UUID',
      () => interaccion({ id_interaccion: 'abc' }),
      CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    ],
    [
      'conectividad fuera del catálogo',
      () => interaccion({ estado_conectividad: 'OFFLINE' }),
      CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    ],
    [
      'valor ausente',
      () => interaccion({ valor: undefined }),
      CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    ],
  ])('%s: rechazada sin cambios', async (_caso, crear, code) => {
    await guardarSesionLocal(sesionLocal());
    const antes = await instantanea();

    await expect(encolarInteraccion(crear())).rejects.toMatchObject({ code });
    expect(await instantanea()).toEqual(antes);
  });

  it('sesión local completada: no admite más interacciones', async () => {
    await guardarSesionLocal(
      sesionLocal({ estado_sesion_offline: 'COMPLETADA' }),
    );

    await expect(encolarInteraccion(interaccion())).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.SESION_LOCAL_COMPLETADA,
    });
    expect(await listarColaSesion(SESION_1, USUARIO_A)).toEqual([]);
  });

  it('el valor null de CONTINUAR sí se admite', async () => {
    await guardarSesionLocal(sesionLocal());

    await expect(
      encolarInteraccion(
        interaccion({ tipo_entrada: 'CONTINUAR', valor: null }),
      ),
    ).resolves.toMatchObject({
      secuencia: 1,
    });
  });
});

describe('consultas de la cola', () => {
  async function preparar() {
    await guardarSesionLocal(sesionLocal());
    await guardarSesionLocal(
      sesionLocal({ id_sesion: SESION_2, id_usuario: USUARIO_B }),
    );
    const items = [];
    for (let i = 0; i < 3; i += 1)
      items.push(await encolarInteraccion(interaccion()));
    await encolarInteraccion(
      interaccion({ id_sesion: SESION_2, id_usuario: USUARIO_B }),
    );
    return items;
  }

  it('lista la cola de la sesión por secuencia, solo del usuario', async () => {
    await preparar();

    expect(secuencias(await listarColaSesion(SESION_1, USUARIO_A))).toEqual([
      1, 2, 3,
    ]);
    expect(await listarColaSesion(SESION_1, USUARIO_B)).toEqual([]);
    expect(await listarColaSesion(SESION_2, USUARIO_A)).toEqual([]);
  });

  it('pendientes excluye las marcadas con error; sesiones con pendientes por usuario', async () => {
    const [, segunda] = await preparar();
    await actualizarEstadoSincronizacion(segunda.id_interaccion, USUARIO_A, {
      estado: 'ERROR_SINCRONIZACION',
      ultimo_error: { codigo: 'FUERA_DE_RANGO', mensaje: 'Mensaje ficticio.' },
    });

    expect(
      secuencias(await listarPendientesSesion(SESION_1, USUARIO_A)),
    ).toEqual([1, 3]);
    expect(await tienePendientes(SESION_1, USUARIO_A)).toBe(true);
    expect(await tienePendientes(SESION_1, USUARIO_B)).toBe(false);
    expect(await listarSesionesConPendientes(USUARIO_A)).toEqual([SESION_1]);
    expect(await listarSesionesConPendientes(USUARIO_B)).toEqual([SESION_2]);
  });
});

describe('estado de sincronización', () => {
  it('marca error con su detalle y cuenta intentos, sin tocar secuencia ni valor', async () => {
    await guardarSesionLocal(sesionLocal());
    const { id_interaccion: id } = await encolarInteraccion(interaccion());

    await actualizarEstadoSincronizacion(id, USUARIO_A, {
      estado: 'PENDIENTE_SINCRONIZACION',
      incrementarIntentos: true,
    });
    const marcada = await actualizarEstadoSincronizacion(id, USUARIO_A, {
      estado: 'ERROR_SINCRONIZACION',
      ultimo_error: { codigo: 'FUERA_DE_RANGO', mensaje: 'Mensaje ficticio.' },
      incrementarIntentos: true,
    });

    expect(marcada).toMatchObject({
      estado_sincronizacion: 'ERROR_SINCRONIZACION',
      ultimo_error: { codigo: 'FUERA_DE_RANGO', mensaje: 'Mensaje ficticio.' },
      intentos: 2,
      secuencia: 1,
      valor: 7,
    });
  });

  it('otro usuario no puede cambiarla; un estado fuera del catálogo se rechaza', async () => {
    await guardarSesionLocal(sesionLocal());
    const { id_interaccion: id } = await encolarInteraccion(interaccion());

    await expect(
      actualizarEstadoSincronizacion(id, USUARIO_B, {
        estado: 'ERROR_SINCRONIZACION',
      }),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE,
    });
    await expect(
      actualizarEstadoSincronizacion(id, USUARIO_A, { estado: 'SINCRONIZADA' }),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    });
    expect(
      (await listarColaSesion(SESION_1, USUARIO_A))[0].estado_sincronizacion,
    ).toBe('PENDIENTE_SINCRONIZACION');
  });
});

describe('eliminar confirmadas', () => {
  it('borra las indicadas, ignora las que ya no están y no toca la sesión', async () => {
    await guardarSesionLocal(sesionLocal());
    const [a, b, c] = [
      await encolarInteraccion(interaccion()),
      await encolarInteraccion(interaccion()),
      await encolarInteraccion(interaccion()),
    ];

    expect(
      await eliminarInteraccionesConfirmadas(USUARIO_A, [
        a.id_interaccion,
        b.id_interaccion,
      ]),
    ).toBe(2);
    expect(
      await eliminarInteraccionesConfirmadas(USUARIO_A, [a.id_interaccion]),
    ).toBe(0);
    expect(
      (await listarColaSesion(SESION_1, USUARIO_A)).map(
        (i) => i.id_interaccion,
      ),
    ).toEqual([c.id_interaccion]);
    expect(
      (await obtenerSesionLocal(SESION_1, USUARIO_A)).ultima_secuencia,
    ).toBe(3);
  });

  it('si alguna es de otro usuario no borra ninguna', async () => {
    await guardarSesionLocal(sesionLocal());
    await guardarSesionLocal(
      sesionLocal({ id_sesion: SESION_2, id_usuario: USUARIO_B }),
    );
    const propia = await encolarInteraccion(interaccion());
    const ajena = await encolarInteraccion(
      interaccion({ id_sesion: SESION_2, id_usuario: USUARIO_B }),
    );
    const antes = await instantanea();

    await expect(
      eliminarInteraccionesConfirmadas(USUARIO_A, [
        propia.id_interaccion,
        ajena.id_interaccion,
      ]),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE,
    });
    expect(await instantanea()).toEqual(antes);
  });
});
