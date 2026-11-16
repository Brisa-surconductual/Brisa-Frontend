import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { cerrarBrisaChatDb } from './brisaChatDb.js';
import { CHAT_STORAGE_ERROR } from './chatStorageError.js';
import {
  AHORA,
  SESION_1,
  USUARIO_A,
  USUARIO_B,
  paquete,
  reiniciarIndexedDb,
} from './entornoPruebas.js';
import {
  guardarPaquete,
  obtenerEtagPaquete,
  obtenerPaquete,
} from './paquetesStore.js';
import { guardarRecurso, obtenerRecurso } from './recursosStore.js';

beforeEach(reiniciarIndexedDb);
afterEach(cerrarBrisaChatDb);

describe('paquetes', () => {
  it('guarda y recupera el paquete de su usuario, con su ETag', async () => {
    await guardarPaquete(paquete());

    expect(await obtenerPaquete(SESION_1, USUARIO_A)).toEqual(paquete());
    expect(await obtenerEtagPaquete(SESION_1, USUARIO_A)).toBe(
      'flujo-ficticio:v3:unidad-ficticia',
    );
  });

  it('solo guarda los campos del contrato del almacén', async () => {
    await guardarPaquete({
      ...paquete(),
      capturaPerfil: { dato: 'x' },
      recursos: [],
      extra: 1,
    });

    expect(
      Object.keys(await obtenerPaquete(SESION_1, USUARIO_A)).sort(),
    ).toEqual([
      'descargado_en',
      'estado_precarga',
      'etag',
      'id_flujo_conversacional',
      'id_sesion',
      'id_usuario',
      'nodos',
      'version_arbol',
    ]);
  });

  it('sin fecha de descarga usa la del dispositivo con su desfase', async () => {
    const guardado = await guardarPaquete(
      paquete({ descargado_en: undefined }),
      { ahora: AHORA },
    );

    expect(guardado.descargado_en).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    );
  });

  it('aislamiento: otro usuario no lo ve ni lo sobrescribe', async () => {
    await guardarPaquete(paquete());

    expect(await obtenerPaquete(SESION_1, USUARIO_B)).toBeNull();
    expect(await obtenerEtagPaquete(SESION_1, USUARIO_B)).toBeNull();
    await expect(
      guardarPaquete(paquete({ id_usuario: USUARIO_B, etag: 'otro' })),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.USUARIO_NO_CORRESPONDE,
    });
    expect((await obtenerPaquete(SESION_1, USUARIO_A)).etag).toBe(
      'flujo-ficticio:v3:unidad-ficticia',
    );
  });

  it('el mismo usuario reemplaza su paquete (nuevo ETag)', async () => {
    await guardarPaquete(paquete());
    await guardarPaquete(
      paquete({
        etag: 'flujo-ficticio:v3:unidad-2',
        estado_precarga: 'PARCIAL',
      }),
    );

    expect(await obtenerEtagPaquete(SESION_1, USUARIO_A)).toBe(
      'flujo-ficticio:v3:unidad-2',
    );
  });

  it.each([
    ['sin usuario', { id_usuario: undefined }],
    ['versión no entera', { version_arbol: '3' }],
    ['nodos que no son lista', { nodos: {} }],
    ['estado de precarga fuera del catálogo', { estado_precarga: 'LISTA' }],
  ])('rechaza un paquete %s y no guarda nada', async (_caso, cambios) => {
    await expect(guardarPaquete(paquete(cambios))).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    });
    expect(await obtenerPaquete(SESION_1, USUARIO_A)).toBeNull();
  });

  it('sin paquete en el dispositivo devuelve null', async () => {
    expect(await obtenerPaquete(SESION_1, USUARIO_A)).toBeNull();
    expect(await obtenerEtagPaquete(SESION_1, USUARIO_A)).toBeNull();
  });

  it('exige la identidad del usuario para consultar', async () => {
    await expect(obtenerPaquete(SESION_1, '')).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    });
  });
});

describe('recursos', () => {
  const recurso = () => ({
    id_recurso: 'recurso-ficticio',
    mime_type: 'image/webp',
    tamano_bytes: 4,
    blob: new Blob(['abcd'], { type: 'image/webp' }),
    descargado_en: '2026-11-13T20:06:10-05:00',
  });

  it('guarda y recupera el archivo como Blob', async () => {
    await guardarRecurso(recurso());
    const leido = await obtenerRecurso('recurso-ficticio');

    expect(leido.mime_type).toBe('image/webp');
    expect(leido.tamano_bytes).toBe(4);
    expect(leido.blob).toBeInstanceOf(Blob);
    expect(await leido.blob.text()).toBe('abcd');
  });

  it('un recurso que no está devuelve null', async () => {
    expect(await obtenerRecurso('no-existe')).toBeNull();
  });

  it('rechaza un registro sin Blob', async () => {
    await expect(
      guardarRecurso({ ...recurso(), blob: 'abcd' }),
    ).rejects.toMatchObject({
      code: CHAT_STORAGE_ERROR.DATOS_INVALIDOS,
    });
    expect(await obtenerRecurso('recurso-ficticio')).toBeNull();
  });
});
