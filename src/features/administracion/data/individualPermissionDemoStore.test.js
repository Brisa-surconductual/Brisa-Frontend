import { describe, expect, it } from 'vitest';

import {
  endOfDayInBogota,
  normalizePermissionList,
} from '../services/individualPermission.js';
import { addDays } from '../utils/tomorrowInBogota.js';
import {
  createDemoPermissions,
  createPermissionStore,
  DEMO_ADMINISTRATIVOS,
  DEMO_CURRENT_USER_ID,
  DEMO_PERMISSION_ID,
} from './individualPermissionDemoStore.js';

// 10:00 del 25 de noviembre en Bogotá.
const NOW = new Date('2026-11-25T15:00:00.000Z');
const TODAY = '2026-11-25';
const BENEFICIARY = DEMO_ADMINISTRATIVOS[5];

const createStore = (options) =>
  createPermissionStore({
    participants: createDemoPermissions(TODAY, options),
    now: () => NOW,
  });

const grantRequest = (
  code,
  alcance,
  { fecha = null, beneficiary = BENEFICIARY } = {},
) => ({
  codigo_participante: code,
  alcance,
  fecha_fin_vigencia: fecha,
  id_usuario_beneficiario: beneficiary,
});

const ids = (page) => page.items.map(({ id_permiso: id }) => id);

describe('Semilla de permisos de demostración', () => {
  it('P-1A2B3C4D solo lista los vigentes: no el vencido ni el revocado', () => {
    const page = createStore().list('P-1A2B3C4D');

    expect(ids(page)).toEqual([
      DEMO_PERMISSION_ID.ACTIVE_1,
      DEMO_PERMISSION_ID.ACTIVE_2,
    ]);
    expect(page.items.every(({ vigente }) => vigente === true)).toBe(true);
    expect(page.items[0]).toHaveProperty('revocado_en', null);
    expect(page.items[0]).toHaveProperty(
      'id_usuario_beneficiario',
      DEMO_ADMINISTRATIVOS[0],
    );
    expect(page).toMatchObject({ total: 2, offset: 0, limit: 20 });
  });

  it('la semilla cumple el contrato (normalizePermiso no descarta nada)', () => {
    const { permissions, discarded } = normalizePermissionList(
      createStore().list('P-1A2B3C4D').items,
    );

    expect(discarded).toBe(0);
    expect(permissions[0].beneficiaryId).toBe(DEMO_ADMINISTRATIVOS[0]);
    expect(permissions[1].endDate).toBe(addDays(TODAY, 30));
  });

  it('P-5E6F7A8B no tiene permisos y un código desconocido da página vacía', () => {
    const store = createStore();

    expect(store.list('P-5E6F7A8B')).toMatchObject({ items: [], total: 0 });
    expect(store.list('P-00000000')).toMatchObject({ items: [], total: 0 });
  });

  it('el escenario vacío deja a P-1A2B3C4D sin permisos', () => {
    expect(createStore({ empty: true }).list('P-1A2B3C4D').items).toEqual([]);
  });

  it('P-9C0D1E2F tiene 25 vigentes en dos páginas', () => {
    const store = createStore();
    const first = store.list('P-9C0D1E2F', { offset: 0, limit: 20 });
    const second = store.list('P-9C0D1E2F', { offset: 20, limit: 20 });

    expect([first.items.length, first.total]).toEqual([20, 25]);
    expect(second.items).toHaveLength(5);
    expect(new Set([...ids(first), ...ids(second)]).size).toBe(25);
  });

  it('un permiso que vence hoy sigue vigente hasta el final del día en Bogotá', () => {
    const store = createPermissionStore({
      participants: {
        'P-1A2B3C4D': [
          {
            id_permiso: DEMO_PERMISSION_ID.ACTIVE_1,
            codigo_participante: 'P-1A2B3C4D',
            alcance: 'ACCESO_INDIVIDUAL',
            fecha_inicio_vigencia: '2026-11-20T14:00:00.000Z',
            fecha_fin_vigencia: endOfDayInBogota(TODAY),
            id_usuario_beneficiario: BENEFICIARY,
            revocado_en: null,
          },
        ],
      },
      now: () => NOW,
    });

    expect(store.list('P-1A2B3C4D').items).toHaveLength(1);
  });
});

describe('Conceder en la demostración', () => {
  it('crea el permiso con la forma del 201: sin beneficiario ni revocado_en', () => {
    const store = createStore();
    const fin = endOfDayInBogota('2026-11-26');
    const result = store.grant(
      grantRequest('P-5E6F7A8B', 'PROGRESION_NARRATIVA', { fecha: fin }),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      alcance: 'PROGRESION_NARRATIVA',
      fecha_fin_vigencia: fin,
      vigente: true,
      codigo_participante: 'P-5E6F7A8B',
    });
    expect(result.data).not.toHaveProperty('revocado_en');
    expect(result.data).not.toHaveProperty('id_usuario_beneficiario');
    expect(store.list('P-5E6F7A8B').items[0]).toHaveProperty(
      'id_usuario_beneficiario',
      BENEFICIARY,
    );
  });

  it('409 con el mismo beneficiario y alcance; otro beneficiario sí puede', () => {
    const store = createStore();
    const same = grantRequest('P-1A2B3C4D', 'ACCESO_INDIVIDUAL', {
      beneficiary: DEMO_ADMINISTRATIVOS[0],
    });

    expect(store.grant(same)).toEqual({
      ok: false,
      status: 409,
      codigo: 'PERMISO_YA_VIGENTE',
      mensaje: '',
    });
    expect(
      store.grant(grantRequest('P-1A2B3C4D', 'ACCESO_INDIVIDUAL')).ok,
    ).toBe(true);
  });

  it('el permiso vencido o revocado no cuenta para el 409', () => {
    const store = createStore();

    // El segundo administrativo tiene un vencido de ACCESO_INDIVIDUAL.
    expect(
      store.grant(
        grantRequest('P-1A2B3C4D', 'ACCESO_INDIVIDUAL', {
          beneficiary: DEMO_ADMINISTRATIVOS[1],
        }),
      ).ok,
    ).toBe(true);
  });

  it('404 con participante desconocido', () => {
    expect(
      createStore().grant(grantRequest('P-00000000', 'ACCESO_INDIVIDUAL')),
    ).toMatchObject({ status: 404, codigo: 'PARTICIPANTE_NO_ENCONTRADO' });
  });

  it('422 si el beneficiario es quien tiene la sesión', () => {
    expect(
      createStore().grant(
        grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', {
          beneficiary: DEMO_CURRENT_USER_ID,
        }),
      ),
    ).toMatchObject({ status: 422, codigo: 'AUTOCONCESION_NO_PERMITIDA' });
  });

  it('422 si el beneficiario no es ADMINISTRATIVO', () => {
    expect(
      createStore().grant(
        grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', {
          beneficiary: '99999999-9999-4999-8999-999999999999',
        }),
      ),
    ).toMatchObject({ status: 422, codigo: 'ROL_INVALIDO_PARA_OPERACION' });
  });

  it('422 si la fecha de fin no es posterior a ahora', () => {
    expect(
      createStore().grant(
        grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', {
          fecha: NOW.toISOString(),
        }),
      ),
    ).toMatchObject({ status: 422, codigo: 'VIGENCIA_INVALIDA' });
  });

  it('respeta el orden del backend: autoconcesión, vigencia y participante', () => {
    const store = createStore();
    const past = '2026-11-01T00:00:00.000Z';

    expect(
      store.grant(
        grantRequest('P-00000000', 'ACCESO_INDIVIDUAL', {
          fecha: past,
          beneficiary: DEMO_CURRENT_USER_ID,
        }),
      ).codigo,
    ).toBe('AUTOCONCESION_NO_PERMITIDA');
    expect(
      store.grant(
        grantRequest('P-00000000', 'ACCESO_INDIVIDUAL', { fecha: past }),
      ).codigo,
    ).toBe('VIGENCIA_INVALIDA');
  });
});

describe('Revocar en la demostración', () => {
  it('quita el permiso de la lista de vigentes y responde como el contrato', () => {
    const store = createStore();

    expect(store.revoke(DEMO_PERMISSION_ID.ACTIVE_1)).toEqual({
      ok: true,
      data: {
        id_permiso: DEMO_PERMISSION_ID.ACTIVE_1,
        vigente: false,
        revocado_en: NOW.toISOString(),
      },
    });
    expect(ids(store.list('P-1A2B3C4D'))).toEqual([
      DEMO_PERMISSION_ID.ACTIVE_2,
    ]);
  });

  it('409 si ya estaba revocado, también al revocar dos veces', () => {
    const store = createStore();

    expect(store.revoke(DEMO_PERMISSION_ID.REVOKED)).toMatchObject({
      status: 409,
      codigo: 'PERMISO_YA_REVOCADO',
    });
    store.revoke(DEMO_PERMISSION_ID.ACTIVE_1);
    expect(store.revoke(DEMO_PERMISSION_ID.ACTIVE_1)).toMatchObject({
      status: 409,
    });
  });

  it('un permiso vencido sin revocar se revoca con 200, como el backend', () => {
    expect(createStore().revoke(DEMO_PERMISSION_ID.EXPIRED)).toMatchObject({
      ok: true,
      data: { vigente: false },
    });
  });

  it('404 con un id inexistente', () => {
    expect(createStore().revoke('no-existe')).toMatchObject({
      status: 404,
      codigo: 'PERMISO_NO_ENCONTRADO',
    });
  });
});
