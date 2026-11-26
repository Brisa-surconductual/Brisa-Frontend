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
  DEMO_INACTIVE_ADMINISTRATIVO,
  DEMO_PERMISSION_ID,
} from './individualPermissionDemoStore.js';

// 10:00 del 25 de noviembre en Bogotá.
const NOW = new Date('2026-11-25T15:00:00.000Z');
const TODAY = '2026-11-25';
const BENEFICIARY = DEMO_ADMINISTRATIVOS[5].id_usuario;

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
      DEMO_ADMINISTRATIVOS[0].id_usuario,
    );
    expect(page).toMatchObject({ total: 2, offset: 0, limit: 20 });
  });

  it('la semilla cumple el contrato (normalizePermiso no descarta nada)', () => {
    const { permissions, discarded } = normalizePermissionList(
      createStore().list('P-1A2B3C4D').items,
    );

    expect(discarded).toBe(0);
    expect(permissions[0].beneficiaryId).toBe(
      DEMO_ADMINISTRATIVOS[0].id_usuario,
    );
    expect(permissions[1].endDate).toBe(addDays(TODAY, 30));
  });

  it('P-5E6F7A8B no tiene permisos y un código desconocido da null (el 404)', () => {
    const store = createStore();

    expect(store.list('P-5E6F7A8B')).toMatchObject({ items: [], total: 0 });
    expect(store.list('P-00000000')).toBeNull();
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
      beneficiary: DEMO_ADMINISTRATIVOS[0].id_usuario,
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
          beneficiary: DEMO_ADMINISTRATIVOS[1].id_usuario,
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

describe('Orden de las comprobaciones y regla del índice (D22)', () => {
  const past = '2026-11-01T00:00:00.000Z';
  const stranger = '99999999-9999-4999-8999-999999999999';

  it('404 antes que el rol del beneficiario', () => {
    expect(
      createStore().grant(
        grantRequest('P-00000000', 'ACCESO_INDIVIDUAL', {
          beneficiary: stranger,
        }),
      ).codigo,
    ).toBe('PARTICIPANTE_NO_ENCONTRADO');
  });

  it('vigencia antes que el rol del beneficiario', () => {
    expect(
      createStore().grant(
        grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', {
          fecha: past,
          beneficiary: stranger,
        }),
      ).codigo,
    ).toBe('VIGENCIA_INVALIDA');
  });

  it('un permiso revocado no bloquea conceder el mismo alcance', () => {
    // El primer administrativo tiene un PROGRESION_NARRATIVA revocado.
    expect(
      createStore().grant(
        grantRequest('P-1A2B3C4D', 'PROGRESION_NARRATIVA', {
          beneficiary: DEMO_ADMINISTRATIVOS[0].id_usuario,
        }),
      ).ok,
    ).toBe(true);
  });

  it('se puede volver a conceder tras revocar', () => {
    const store = createStore();
    const same = grantRequest('P-1A2B3C4D', 'ACCESO_INDIVIDUAL', {
      beneficiary: DEMO_ADMINISTRATIVOS[0].id_usuario,
    });

    expect(store.grant(same).ok).toBe(false);
    store.revoke(DEMO_PERMISSION_ID.ACTIVE_1);
    expect(store.grant(same).ok).toBe(true);
  });

  it('el mismo beneficiario puede tener otro alcance', () => {
    const store = createStore();

    expect(
      store.grant(
        grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', {
          beneficiary: BENEFICIARY,
        }),
      ).ok,
    ).toBe(true);
    expect(
      store.grant(
        grantRequest('P-5E6F7A8B', 'PROGRESION_NARRATIVA', {
          beneficiary: BENEFICIARY,
        }),
      ).ok,
    ).toBe(true);
  });

  it('lo recién concedido sale primero en la lista', () => {
    const store = createStore();
    const granted = store.grant(
      grantRequest('P-1A2B3C4D', 'PROGRESION_NARRATIVA', {
        beneficiary: DEMO_ADMINISTRATIVOS[4].id_usuario,
      }),
    );

    expect(ids(store.list('P-1A2B3C4D'))[0]).toBe(granted.data.id_permiso);
  });
});

describe('Correo del beneficiario y lista de beneficiarios (D36, D37)', () => {
  it('cada elemento del GET trae correo_beneficiario; el 201 no', () => {
    const store = createStore();
    const [item] = store.list('P-1A2B3C4D').items;

    expect(item.correo_beneficiario).toBe(
      DEMO_ADMINISTRATIVOS[0].correo_electronico,
    );

    const created = store.grant(
      grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL'),
    );
    expect(created.data).not.toHaveProperty('correo_beneficiario');
  });

  it('listBeneficiaries trae solo cuentas activas, por correo, con paginación', () => {
    const store = createStore();
    const page = store.listBeneficiaries({ offset: 100, limit: 100 });

    expect(page.total).toBe(105);
    expect(page.items).toHaveLength(5);
    expect(page.items[0]).toEqual({
      id_usuario: expect.any(String),
      correo_electronico: expect.any(String),
    });
    expect(
      store
        .listBeneficiaries({ offset: 0, limit: 105 })
        .items.some(
          (b) => b.id_usuario === DEMO_INACTIVE_ADMINISTRATIVO.id_usuario,
        ),
    ).toBe(false);
  });

  it('el POST sí acepta al administrativo con la cuenta no activa (A-079)', () => {
    expect(
      createStore().grant(
        grantRequest('P-5E6F7A8B', 'ACCESO_INDIVIDUAL', {
          beneficiary: DEMO_INACTIVE_ADMINISTRATIVO.id_usuario,
        }),
      ).ok,
    ).toBe(true);
  });
});
