import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import {
  grantPermission,
  listPermissions,
  revokePermission,
} from './individualPermissionsApi.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const CODE = 'P-1A2B3C4D';
const failWith = (status, data) => ({ response: { status, data } });

beforeEach(() => vi.resetAllMocks());

describe('listPermissions', () => {
  it('GET con el código y solo_vigentes, y devuelve items', async () => {
    const items = [{ id_permiso: 'p-1' }];
    apiClient.get.mockResolvedValue({
      status: 200,
      data: { items, total: 1, offset: 0, limit: 20 },
    });

    await expect(listPermissions(CODE)).resolves.toBe(items);
    expect(apiClient.get).toHaveBeenCalledWith('/admin/permisos-individuales', {
      params: { codigo_participante: CODE, solo_vigentes: true },
    });
  });

  it('responde null si el participante no existe', async () => {
    apiClient.get.mockRejectedValue(
      failWith(404, { codigo: 'PARTICIPANTE_NO_ENCONTRADO' }),
    );

    await expect(listPermissions(CODE)).resolves.toBeNull();
  });

  it('rechaza una respuesta sin items', async () => {
    apiClient.get.mockResolvedValue({ data: [] });

    await expect(listPermissions(CODE)).rejects.toThrow('no es válido');
  });

  it('lanza SIN_CONEXION si no hay respuesta', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));

    await expect(listPermissions(CODE)).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
    });
  });

  it('lanza el error normalizado en los demás casos', async () => {
    apiClient.get.mockRejectedValue(
      failWith(500, { codigo: 'ERROR_INTERNO', mensaje: 'Falla.' }),
    );

    await expect(listPermissions(CODE)).rejects.toMatchObject({
      status: 500,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Falla.',
    });
  });
});

describe('grantPermission', () => {
  const request = Object.freeze({
    codigo_participante: CODE,
    alcance: 'ACCESO_INDIVIDUAL',
    fecha_fin_vigencia: null,
  });

  it('POST con el cuerpo tal cual y devuelve el permiso creado', async () => {
    const data = { id_permiso: 'p-2', codigo_participante: CODE };
    apiClient.post.mockResolvedValue({ status: 201, data });

    await expect(grantPermission(request)).resolves.toEqual({ ok: true, data });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/permisos-individuales',
      request,
    );
  });

  it.each([
    [404, 'PARTICIPANTE_NO_ENCONTRADO'],
    [409, 'PERMISO_YA_VIGENTE'],
    [422, 'AUTOCONCESION_NO_PERMITIDA'],
  ])('devuelve el rechazo %i %s', async (status, codigo) => {
    apiClient.post.mockRejectedValue(
      failWith(status, { status, codigo, mensaje: 'Texto.' }),
    );

    await expect(grantPermission(request)).resolves.toEqual({
      ok: false,
      status,
      codigo,
      mensaje: 'Texto.',
    });
  });

  it('lanza los rechazos no previstos y la falta de conexión', async () => {
    apiClient.post.mockRejectedValueOnce(
      failWith(422, { codigo: 'FECHA_FIN_INVALIDA' }),
    );
    await expect(grantPermission(request)).rejects.toMatchObject({
      status: 422,
      codigo: 'FECHA_FIN_INVALIDA',
    });

    apiClient.post.mockRejectedValueOnce(new Error('Network Error'));
    await expect(grantPermission(request)).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
    });
  });
});

describe('revokePermission', () => {
  it('POST a revocar con cuerpo vacío y confirma', async () => {
    apiClient.post.mockResolvedValue({
      status: 200,
      data: {
        id_permiso: 'perm-1',
        vigente: false,
        revocado_en: '2026-11-25T15:00:00.000Z',
      },
    });

    await expect(revokePermission('perm-1')).resolves.toEqual({ ok: true });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/permisos-individuales/perm-1/revocar',
      {},
    );
  });

  it('codifica el id en la ruta', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: {} });

    await revokePermission('a/b');

    expect(apiClient.post.mock.calls[0][0]).toBe(
      '/admin/permisos-individuales/a%2Fb/revocar',
    );
  });

  it('devuelve el rechazo 409 PERMISO_YA_REVOCADO', async () => {
    apiClient.post.mockRejectedValue(
      failWith(409, { codigo: 'PERMISO_YA_REVOCADO', mensaje: 'Ya.' }),
    );

    await expect(revokePermission('perm-1')).resolves.toEqual({
      ok: false,
      status: 409,
      codigo: 'PERMISO_YA_REVOCADO',
      mensaje: 'Ya.',
    });
  });

  it('lanza SIN_CONEXION y los demás errores', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Network Error'));
    await expect(revokePermission('perm-1')).rejects.toMatchObject({
      codigo: 'SIN_CONEXION',
    });

    apiClient.post.mockRejectedValueOnce(
      failWith(404, { codigo: 'PERMISO_NO_ENCONTRADO' }),
    );
    await expect(revokePermission('perm-1')).rejects.toMatchObject({
      status: 404,
    });
  });
});
