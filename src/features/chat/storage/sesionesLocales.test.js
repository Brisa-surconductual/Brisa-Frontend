import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cerrarBrisaChatDb } from './brisaChatDb.js';
import { CHAT_STORAGE_ERROR } from './chatStorageError.js';
import {
  AHORA,
  SESION_1,
  SESION_2,
  USUARIO_A,
  USUARIO_B,
  reiniciarIndexedDb,
  sesionLocal,
} from './entornoPruebas.js';
import {
  actualizarSesionLocal,
  guardarSesionLocal,
  listarSesionesLocales,
  obtenerSesionLocal,
} from './sesionesLocalesStore.js';

beforeEach(reiniciarIndexedDb);
afterEach(cerrarBrisaChatDb);

describe('sesiones locales', () => {
  it('guarda y recupera la sesión con la fecha de actualización', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: 41 }), {
      ahora: AHORA,
    });

    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toMatchObject({
      id_sesion: SESION_1,
      id_usuario: USUARIO_A,
      id_nodo_actual: 'nodo-1',
      ultima_secuencia: 41,
      estado_sesion_offline: 'EN_CURSO',
      actualizado_en: expect.stringMatching(/[+-]\d{2}:\d{2}$/),
    });
  });

  it('aislamiento: otro usuario no la ve, no la lista ni la reemplaza', async () => {
    await guardarSesionLocal(sesionLocal());
    await guardarSesionLocal(
      sesionLocal({ id_sesion: SESION_2, id_usuario: USUARIO_B }),
    );

    expect(await obtenerSesionLocal(SESION_1, USUARIO_B)).toBeNull();
    expect(
      (await listarSesionesLocales(USUARIO_A)).map((s) => s.id_sesion),
    ).toEqual([SESION_1]);
    await expect(
      guardarSesionLocal(sesionLocal({ id_usuario: USUARIO_B })),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE,
    });
    await expect(
      actualizarSesionLocal(SESION_1, USUARIO_B, { id_nodo_actual: 'x' }),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE,
    });
  });

  it('una secuencia desconocida se guarda como null, sin inventarla', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: null }));

    expect(
      (await obtenerSesionLocal(SESION_1, USUARIO_A)).ultima_secuencia,
    ).toBeNull();
  });

  it('la secuencia no retrocede y una conocida no se pierde con null', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: 5 }));

    await expect(
      guardarSesionLocal(sesionLocal({ ultima_secuencia: 4 })),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    });
    await guardarSesionLocal(
      sesionLocal({ ultima_secuencia: null, id_nodo_actual: 'nodo-2' }),
    );

    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toMatchObject({
      ultima_secuencia: 5,
      id_nodo_actual: 'nodo-2',
    });
  });

  it('actualiza el nodo actual y el estado sin tocar la secuencia', async () => {
    await guardarSesionLocal(sesionLocal({ ultima_secuencia: 3 }));
    await actualizarSesionLocal(SESION_1, USUARIO_A, {
      id_nodo_actual: 'nodo-9',
      estado_sesion_offline: 'INTERRUMPIDA',
    });

    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toMatchObject({
      id_nodo_actual: 'nodo-9',
      estado_sesion_offline: 'INTERRUMPIDA',
      ultima_secuencia: 3,
    });
  });

  it('actualizar una sesión inexistente falla sin crearla', async () => {
    await expect(
      actualizarSesionLocal(SESION_1, USUARIO_A, { id_nodo_actual: 'x' }),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.SESION_LOCAL_NO_ENCONTRADA,
    });
    expect(await obtenerSesionLocal(SESION_1, USUARIO_A)).toBeNull();
  });

  it.each([
    ['estado fuera del catálogo', { estado_sesion_offline: 'ACTIVA' }],
    ['secuencia negativa', { ultima_secuencia: -1 }],
    ['secuencia no entera', { ultima_secuencia: 1.5 }],
    ['sin nodo actual', { id_nodo_actual: '' }],
  ])('rechaza una sesión con %s', async (_caso, cambios) => {
    await expect(
      guardarSesionLocal(sesionLocal(cambios)),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    });
  });
});
