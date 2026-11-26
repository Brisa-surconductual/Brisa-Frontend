import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/utils/apiClient.jsx';

import {
  grantPermission,
  listBeneficiaries,
  listPermissions,
  revokePermission,
} from './individualPermissionsApi.js';

vi.mock('@/shared/utils/apiClient.jsx', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const CODE = 'P-1A2B3C4D';
const ID = '11111111-1111-4111-8111-111111111111';
const BENEFICIARY = '22222222-2222-4222-8222-222222222222';
const failWith = (status, data) => ({ response: { status, data } });

beforeEach(() => vi.resetAllMocks());

describe('listPermissions', () => {
  it('GET con código, solo_vigentes, offset y limit; devuelve la página', async () => {
    const items = [{ id_permiso: ID }];
    apiClient.get.mockResolvedValue({
      status: 200,
      data: { items, total: 1, offset: 0, limit: 20 },
    });

    await expect(listPermissions(CODE)).resolves.toEqual({
      items,
      total: 1,
      offset: 0,
      limit: 20,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/admin/permisos-individuales', {
      params: {
        codigo_participante: CODE,
        solo_vigentes: true,
        offset: 0,
        limit: 20,
      },
    });
  });

  it('envía el offset y el limit pedidos', async () => {
    apiClient.get.mockResolvedValue({
      data: { items: [], total: 25, offset: 20, limit: 10 },
    });

    await listPermissions(CODE, { offset: 20, limit: 10 });

    expect(apiClient.get.mock.calls[0][1].params).toMatchObject({
      offset: 20,
      limit: 10,
    });
  });

  it('un código desconocido se lanza como 404 normalizado (D38)', async () => {
    apiClient.get.mockRejectedValue(
      failWith(404, {
        status: 404,
        codigo: 'PARTICIPANTE_NO_ENCONTRADO',
        mensaje: 'El participante seleccionado no existe.',
      }),
    );

    await expect(listPermissions(CODE)).rejects.toMatchObject({
      status: 404,
      codigo: 'PARTICIPANTE_NO_ENCONTRADO',
    });
  });

  it.each([
    ['sin items', { total: 0, offset: 0, limit: 20 }],
    ['con total inválido', { items: [], total: -1, offset: 0, limit: 20 }],
    ['con offset inválido', { items: [], total: 0, offset: '0', limit: 20 }],
    ['con limit inválido', { items: [], total: 0, offset: 0, limit: 0 }],
  ])('rechaza una respuesta %s', async (_, data) => {
    apiClient.get.mockResolvedValue({ data });

    await expect(listPermissions(CODE)).rejects.toThrow('no es válido');
  });

  it('lanza SIN_CONEXION si no hay respuesta', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));

    await expect(listPermissions(CODE)).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
    });
  });

  it('lanza el error normalizado (500 y 400 de validación)', async () => {
    apiClient.get.mockRejectedValueOnce(
      failWith(500, {
        codigo: 'ERROR_PERSISTENCIA_PERMISOS',
        mensaje: 'Falla.',
      }),
    );
    await expect(listPermissions(CODE)).rejects.toMatchObject({
      status: 500,
      codigo: 'ERROR_PERSISTENCIA_PERMISOS',
      mensaje: 'Falla.',
    });

    apiClient.get.mockRejectedValueOnce(
      failWith(400, {
        statusCode: 400,
        message: ['limit must not be greater than 100'],
      }),
    );
    await expect(listPermissions(CODE)).rejects.toMatchObject({ status: 400 });
  });
});

describe('grantPermission', () => {
  const request = Object.freeze({
    codigo_participante: CODE,
    alcance: 'ACCESO_INDIVIDUAL',
    fecha_fin_vigencia: null,
    id_usuario_beneficiario: BENEFICIARY,
  });

  it('POST con el cuerpo tal cual y devuelve el permiso creado', async () => {
    const data = { id_permiso: ID, codigo_participante: CODE };
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
    [422, 'ROL_INVALIDO_PARA_OPERACION'],
    [422, 'VIGENCIA_INVALIDA'],
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
      failWith(500, { codigo: 'ERROR_PERSISTENCIA_PERMISOS' }),
    );
    await expect(grantPermission(request)).rejects.toMatchObject({
      status: 500,
      codigo: 'ERROR_PERSISTENCIA_PERMISOS',
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
        id_permiso: ID,
        vigente: false,
        revocado_en: '2026-11-25T15:00:00.000Z',
      },
    });

    await expect(revokePermission(ID)).resolves.toEqual({ ok: true });
    expect(apiClient.post).toHaveBeenCalledWith(
      `/admin/permisos-individuales/${ID}/revocar`,
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

  it.each([
    [404, 'PERMISO_NO_ENCONTRADO'],
    [409, 'PERMISO_YA_REVOCADO'],
  ])('devuelve el rechazo %i %s', async (status, codigo) => {
    apiClient.post.mockRejectedValue(
      failWith(status, { codigo, mensaje: 'Texto.' }),
    );

    await expect(revokePermission(ID)).resolves.toEqual({
      ok: false,
      status,
      codigo,
      mensaje: 'Texto.',
    });
  });

  it('lanza SIN_CONEXION y los demás errores', async () => {
    apiClient.post.mockRejectedValueOnce(new Error('Network Error'));
    await expect(revokePermission(ID)).rejects.toMatchObject({
      codigo: 'SIN_CONEXION',
    });

    apiClient.post.mockRejectedValueOnce(
      failWith(500, { codigo: 'ERROR_PERSISTENCIA_PERMISOS' }),
    );
    await expect(revokePermission(ID)).rejects.toMatchObject({ status: 500 });
  });
});

describe('Rechazos que no son los esperados (status y codigo deben coincidir)', () => {
  const request = {
    codigo_participante: CODE,
    alcance: 'ACCESO_INDIVIDUAL',
    fecha_fin_vigencia: null,
    id_usuario_beneficiario: BENEFICIARY,
  };

  it.each([
    [404, 'PERMISO_NO_ENCONTRADO'],
    [409, 'PERMISO_YA_REVOCADO'],
    [400, 'DESCONOCIDO'],
  ])('al conceder, %i %s se lanza', async (status, codigo) => {
    apiClient.post.mockRejectedValue(failWith(status, { codigo }));

    await expect(grantPermission(request)).rejects.toMatchObject({
      status,
    });
  });

  it.each([
    [404, 'PARTICIPANTE_NO_ENCONTRADO'],
    [422, 'AUTOCONCESION_NO_PERMITIDA'],
    [400, 'DESCONOCIDO'],
  ])('al revocar, %i %s se lanza', async (status, codigo) => {
    apiClient.post.mockRejectedValue(failWith(status, { codigo }));

    await expect(revokePermission(ID)).rejects.toMatchObject({ status });
  });

  it('un listado con data undefined se rechaza', async () => {
    apiClient.get.mockResolvedValue({ data: undefined });

    await expect(listPermissions(CODE)).rejects.toThrow('no es válido');
  });
});

describe('listBeneficiaries (D37)', () => {
  const items = [
    { id_usuario: BENEFICIARY, correo_electronico: 'ana@usco.edu.co' },
  ];

  it('GET de beneficiarios con offset y limit 100 por defecto; devuelve la página', async () => {
    apiClient.get.mockResolvedValue({
      data: { items, total: 1, offset: 0, limit: 100 },
    });

    await expect(listBeneficiaries()).resolves.toEqual({
      items,
      total: 1,
      offset: 0,
      limit: 100,
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/admin/permisos-individuales/beneficiarios',
      { params: { offset: 0, limit: 100 } },
    );
  });

  it('envía el offset y el limit pedidos', async () => {
    apiClient.get.mockResolvedValue({
      data: { items: [], total: 105, offset: 100, limit: 50 },
    });

    await listBeneficiaries({ offset: 100, limit: 50 });

    expect(apiClient.get.mock.calls[0][1].params).toEqual({
      offset: 100,
      limit: 50,
    });
  });

  it.each([
    ['sin items', { total: 0, offset: 0, limit: 100 }],
    ['con total inválido', { items: [], total: -1, offset: 0, limit: 100 }],
    ['con limit inválido', { items: [], total: 0, offset: 0, limit: 0 }],
  ])('rechaza una respuesta %s', async (_, data) => {
    apiClient.get.mockResolvedValue({ data });

    await expect(listBeneficiaries()).rejects.toThrow('no es válido');
  });

  it('lanza el error normalizado (403, 500 y sin conexión)', async () => {
    apiClient.get.mockRejectedValueOnce(failWith(403, { message: 'No' }));
    await expect(listBeneficiaries()).rejects.toMatchObject({ status: 403 });

    apiClient.get.mockRejectedValueOnce(
      failWith(500, {
        codigo: 'ERROR_PERSISTENCIA_PERMISOS',
        mensaje: 'Falla.',
      }),
    );
    await expect(listBeneficiaries()).rejects.toMatchObject({
      status: 500,
      codigo: 'ERROR_PERSISTENCIA_PERMISOS',
    });

    apiClient.get.mockRejectedValueOnce(new Error('Network Error'));
    await expect(listBeneficiaries()).rejects.toMatchObject({
      codigo: 'SIN_CONEXION',
    });
  });
});
