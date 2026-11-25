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

describe('Consulta no válida (D30)', () => {
  it.each([
    ['código vacío', '', {}],
    ['código que no es A7', 'PART-0001', {}],
    ['limit 0', 'P-1A2B3C4D', { limit: 0 }],
    ['limit 101', 'P-1A2B3C4D', { limit: 101 }],
    ['limit 1,5', 'P-1A2B3C4D', { limit: 1.5 }],
    ['offset negativo', 'P-1A2B3C4D', { offset: -1 }],
  ])('lanza con %s sin llamar al backend', async (_, code, page) => {
    await expect(listPermissions(code, page)).rejects.toThrow('no válido');
    expect(transport.get).not.toHaveBeenCalled();
  });

  it('la página pedida llega al transporte', async () => {
    transport.get.mockResolvedValue({
      data: { items: [], total: 0, offset: 20, limit: 10 },
    });

    await listPermissions('P-1A2B3C4D', { offset: 20, limit: 10 });

    expect(transport.get.mock.calls[0][1].params).toMatchObject({
      offset: 20,
      limit: 10,
    });
  });
});

describe('Fuente con la API: revocar y errores', () => {
  it('revokePermission confirma y deja pasar el rechazo esperado', async () => {
    transport.post.mockResolvedValueOnce({ data: {} });
    await expect(revokePermission(ID)).resolves.toEqual({ ok: true });

    transport.post.mockRejectedValueOnce({
      response: { status: 404, data: { codigo: 'PERMISO_NO_ENCONTRADO' } },
    });
    await expect(revokePermission(ID)).resolves.toMatchObject({
      ok: false,
      status: 404,
      codigo: 'PERMISO_NO_ENCONTRADO',
    });
  });

  it('listPermissions lanza el error de la API (500 y 400)', async () => {
    transport.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { codigo: 'ERROR_PERSISTENCIA_PERMISOS' },
      },
    });
    await expect(listPermissions('P-1A2B3C4D')).rejects.toMatchObject({
      status: 500,
    });

    transport.get.mockRejectedValueOnce({
      response: { status: 400, data: { statusCode: 400, message: 'Bad' } },
    });
    await expect(listPermissions('P-1A2B3C4D')).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('La demostración exige estar activa', () => {
  it('con DEV pero sin VITE_M08_DEMO usa la API, no la demo', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');
    transport.get.mockResolvedValue({
      data: { items: [], total: 0, offset: 0, limit: 20 },
    });

    await listPermissions('P-1A2B3C4D');

    expect(transport.get).toHaveBeenCalledTimes(1);
  });
});

describe('Demo: lo recién concedido sale primero (D32)', () => {
  it('el permiso nuevo encabeza la lista', async () => {
    enableDemo();

    const granted = await grantPermission(
      request('P-1A2B3C4D', 'PROGRESION_NARRATIVA', DEMO_ADMINISTRATIVOS[7]),
    );
    const { permissions } = await listPermissions('P-1A2B3C4D');

    expect(permissions[0].id).toBe(granted.permission.id);
  });
});
