import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDemoScenarios } from './demoScenarioTestEnv.js';
import { resetPermissionDemoStore } from './individualPermissionDemoSource.js';
import {
  DEMO_ADMINISTRATIVOS,
  DEMO_CURRENT_USER_ID,
  DEMO_PERMISSION_ID,
} from './individualPermissionDemoStore.js';
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

const ID = '11111111-1111-4111-8111-111111111111';

const RAW = Object.freeze({
  id_permiso: ID,
  alcance: 'ACCESO_INDIVIDUAL',
  fecha_inicio_vigencia: '2026-11-25T15:04:00.000Z',
  fecha_fin_vigencia: '2026-12-02T04:59:59.000Z',
  vigente: true,
});

const request = (
  code,
  alcance = 'ACCESO_INDIVIDUAL',
  beneficiary = DEMO_ADMINISTRATIVOS[5],
) => ({
  codigo_participante: code,
  alcance,
  fecha_fin_vigencia: null,
  id_usuario_beneficiario: beneficiary,
});

beforeEach(() => {
  resetDemoScenarios(vi);
  vi.stubEnv('VITE_M08_DEMO', '');
  resetPermissionDemoStore();
  for (const fn of Object.values(transport)) fn.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe('Fuente de permisos con la API', () => {
  it('normaliza items, cuenta los descartados y conserva la paginación', async () => {
    transport.get.mockResolvedValue({
      data: {
        items: [RAW, { ...RAW, alcance: 'X' }, { ...RAW, id_permiso: 'p-1' }],
        total: 3,
        offset: 0,
        limit: 20,
      },
    });

    const result = await listPermissions('P-1A2B3C4D');

    expect(result.permissions.map(({ id, endDate }) => [id, endDate])).toEqual([
      [ID, '2026-12-01'],
    ]);
    expect(result).toMatchObject({
      discarded: 2,
      total: 3,
      offset: 0,
      limit: 20,
    });
  });

  it('normaliza el permiso creado y deja pasar los rechazos', async () => {
    transport.post.mockResolvedValueOnce({
      data: { ...RAW, codigo_participante: 'P-1A2B3C4D' },
    });
    await expect(grantPermission(request('P-1A2B3C4D'))).resolves.toMatchObject(
      {
        ok: true,
        permission: { id: ID, endDate: '2026-12-01', active: true },
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
    transport.post.mockResolvedValue({ data: { id_permiso: ID } });

    await expect(grantPermission(request('P-1A2B3C4D'))).resolves.toEqual({
      ok: true,
      permission: null,
    });
  });
});

describe('Fuente de permisos en demostración', () => {
  it('no llama a la API y solo trae los vigentes, con el beneficiario', async () => {
    enableDemo();

    const { permissions, total } = await listPermissions('P-1A2B3C4D');

    expect(permissions.map(({ id }) => id)).toEqual([
      DEMO_PERMISSION_ID.ACTIVE_1,
      DEMO_PERMISSION_ID.ACTIVE_2,
    ]);
    expect(permissions[0].beneficiaryId).toBe(DEMO_ADMINISTRATIVOS[0]);
    expect(total).toBe(2);
    expect(transport.get).not.toHaveBeenCalled();
  });

  it('pagina P-9C0D1E2F y un código desconocido da lista vacía', async () => {
    enableDemo();

    const first = await listPermissions('P-9C0D1E2F');
    const second = await listPermissions('P-9C0D1E2F', {
      offset: 20,
      limit: 20,
    });

    expect([first.permissions.length, first.total]).toEqual([20, 25]);
    expect(second.permissions).toHaveLength(5);
    await expect(listPermissions('P-00000000')).resolves.toMatchObject({
      permissions: [],
      total: 0,
    });
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

  it('conceder a quien tiene la sesión da el 422 natural de autoconcesión', async () => {
    enableDemo();

    await expect(
      grantPermission(
        request('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', DEMO_CURRENT_USER_ID),
      ),
    ).resolves.toMatchObject({
      status: 422,
      codigo: 'AUTOCONCESION_NO_PERMITIDA',
    });
  });

  it.each([
    ['conflicto', 409, 'PERMISO_YA_VIGENTE', true],
    ['autoconcesion', 422, 'AUTOCONCESION_NO_PERMITIDA', false],
    ['rol-invalido', 422, 'ROL_INVALIDO_PARA_OPERACION', true],
    ['vigencia-invalida', 422, 'VIGENCIA_INVALIDA', false],
  ])(
    'el escenario %s fuerza %i %s al conceder',
    async (scenario, status, codigo, withMessage) => {
      enableDemo(scenario);

      const result = await grantPermission(request('P-5E6F7A8B'));

      expect(result).toMatchObject({ ok: false, status, codigo });
      // Con mensaje del servidor simulado, para ver su texto tal cual.
      expect(result.mensaje !== '').toBe(withMessage);
    },
  );

  it.each([
    ['revocacion-revocado', 409, 'PERMISO_YA_REVOCADO'],
    ['revocacion-inexistente', 404, 'PERMISO_NO_ENCONTRADO'],
  ])(
    'el escenario %s fuerza %i %s al revocar',
    async (scenario, status, codigo) => {
      enableDemo(scenario);

      await expect(
        revokePermission(DEMO_PERMISSION_ID.ACTIVE_1),
      ).resolves.toMatchObject({ ok: false, status, codigo });
    },
  );

  it('los escenarios error y revocacion-error fallan', async () => {
    enableDemo('error');
    await expect(listPermissions('P-1A2B3C4D')).rejects.toThrow('simulado');

    enableDemo('revocacion-error');
    await expect(
      revokePermission(DEMO_PERMISSION_ID.ACTIVE_1),
    ).rejects.toMatchObject({ status: null, codigo: 'SIN_CONEXION' });
  });
});
