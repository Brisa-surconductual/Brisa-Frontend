import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { resetPermissionDemoStore } from './individualPermissionDemoSource.js';
import {
  grantPermission,
  listPermissions,
  revokePermission,
} from './individualPermissionSource.js';

const transport = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: transport }));

// Tiempo real: la demostración se carga con import() dinámico.
function enableDemo(scenario = '') {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_M08_DEMO', 'true');
  vi.stubEnv('VITE_M08_PERMISSION_SCENARIO', scenario);
}

const RAW = Object.freeze({
  id_permiso: 'perm-1',
  alcance: 'ACCESO_INDIVIDUAL',
  fecha_inicio_vigencia: '2026-11-25T15:04:00.000Z',
  fecha_fin_vigencia: '2026-12-02T04:59:59.000Z',
  vigente: true,
});

const request = (code, alcance = 'ACCESO_INDIVIDUAL') => ({
  codigo_participante: code,
  alcance,
  fecha_fin_vigencia: null,
});

beforeEach(() => {
  resetDemoScenarios(vi);
  vi.stubEnv('VITE_M08_DEMO', '');
  resetPermissionDemoStore();
  for (const fn of Object.values(transport)) fn.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe('Fuente de permisos con la API', () => {
  it('normaliza items y cuenta los elementos descartados', async () => {
    transport.get.mockResolvedValue({
      data: {
        items: [RAW, { ...RAW, alcance: 'X' }],
        total: 2,
        offset: 0,
        limit: 20,
      },
    });

    const result = await listPermissions('P-1A2B3C4D');

    expect(result.permissions.map(({ id, endDate }) => [id, endDate])).toEqual([
      ['perm-1', '2026-12-01'],
    ]);
    expect(result.discarded).toBe(1);
  });

  it('normaliza el permiso creado y deja pasar los rechazos', async () => {
    transport.post.mockResolvedValueOnce({
      data: { ...RAW, codigo_participante: 'P-1A2B3C4D' },
    });
    await expect(grantPermission(request('P-1A2B3C4D'))).resolves.toMatchObject(
      {
        ok: true,
        permission: { id: 'perm-1', endDate: '2026-12-01', active: true },
      },
    );

    transport.post.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { codigo: 'AUTOCONCESION_NO_PERMITIDA', mensaje: 'No.' },
      },
    });
    await expect(grantPermission(request('P-1A2B3C4D'))).resolves.toEqual({
      ok: false,
      status: 422,
      codigo: 'AUTOCONCESION_NO_PERMITIDA',
      mensaje: 'No.',
    });
  });

  it('un 201 que no se puede normalizar no es un fallo: permission null para recargar', async () => {
    transport.post.mockResolvedValue({ data: { id_permiso: 'perm-1' } });

    await expect(grantPermission(request('P-1A2B3C4D'))).resolves.toEqual({
      ok: true,
      permission: null,
    });
  });
});

describe('Fuente de permisos en demostración', () => {
  it('no llama a la API y solo trae los vigentes', async () => {
    enableDemo();

    const { permissions } = await listPermissions('P-1A2B3C4D');

    expect(permissions.map(({ id }) => id)).toEqual([
      'demo-permiso-1',
      'demo-permiso-2',
    ]);
    expect(transport.get).not.toHaveBeenCalled();
  });

  it('concede, choca con el permiso vigente y revoca', async () => {
    enableDemo();

    const granted = await grantPermission(request('P-5E6F7A8B'));
    expect(granted).toMatchObject({
      ok: true,
      permission: { scope: 'ACCESO_INDIVIDUAL' },
    });
    await expect(grantPermission(request('P-5E6F7A8B'))).resolves.toMatchObject(
      { status: 409 },
    );

    await expect(revokePermission(granted.permission.id)).resolves.toEqual({
      ok: true,
    });
    expect((await listPermissions('P-5E6F7A8B')).permissions).toEqual([]);
    await expect(
      revokePermission(granted.permission.id),
    ).resolves.toMatchObject({
      status: 409,
      codigo: 'PERMISO_YA_REVOCADO',
    });
  });

  it('el escenario conflicto fuerza el 409 con un mensaje del servidor', async () => {
    enableDemo('conflicto');

    const result = await grantPermission(
      request('P-5E6F7A8B', 'PROGRESION_NARRATIVA'),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      codigo: 'PERMISO_YA_VIGENTE',
    });
    expect(result.mensaje).toMatch(/simulado del servidor/);
  });

  it('el escenario autoconcesion fuerza el 422', async () => {
    enableDemo('autoconcesion');

    await expect(grantPermission(request('P-5E6F7A8B'))).resolves.toMatchObject(
      {
        ok: false,
        status: 422,
        codigo: 'AUTOCONCESION_NO_PERMITIDA',
      },
    );
  });

  it('los escenarios error y revocacion-error fallan', async () => {
    enableDemo('error');
    await expect(listPermissions('P-1A2B3C4D')).rejects.toThrow('simulado');

    enableDemo('revocacion-error');
    await expect(revokePermission('demo-permiso-1')).rejects.toMatchObject({
      status: null,
      codigo: 'SIN_CONEXION',
    });
  });
});
