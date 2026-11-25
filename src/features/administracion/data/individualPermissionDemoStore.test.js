import { describe, expect, it } from 'vitest';

import {
  endOfDayInBogota,
  normalizePermissionList,
} from '../services/individualPermission.js';
import { addDays } from '../utils/tomorrowInBogota.js';
import {
  createDemoPermissions,
  createPermissionStore,
} from './individualPermissionDemoStore.js';

// 10:00 del 25 de noviembre en Bogotá.
const NOW = new Date('2026-11-25T15:00:00.000Z');
const TODAY = '2026-11-25';

const createStore = (options) =>
  createPermissionStore({
    participants: createDemoPermissions(TODAY, options),
    now: () => NOW,
  });

const grantRequest = (code, alcance, fecha = null) => ({
  codigo_participante: code,
  alcance,
  fecha_fin_vigencia: fecha,
});

describe('Semilla de permisos de demostración', () => {
  it('P-1A2B3C4D solo lista los vigentes: no el vencido ni el revocado', () => {
    const rows = createStore().list('P-1A2B3C4D');

    expect(rows.map(({ id_permiso: id }) => id)).toEqual([
      'demo-permiso-1',
      'demo-permiso-2',
    ]);
    expect(rows.every(({ vigente }) => vigente === true)).toBe(true);
    expect(rows[0]).not.toHaveProperty('revocado_en');
  });

  it('la semilla cumple el contrato (normalizePermiso no descarta nada)', () => {
    const { permissions, discarded } = normalizePermissionList(
      createStore().list('P-1A2B3C4D'),
    );

    expect(discarded).toBe(0);
    expect(permissions[0].holder).toEqual({
      id: 'demo-admin',
      name: 'Administrador de demostración',
    });
    expect(permissions[1].holder).toBeNull();
    expect(permissions[1].endDate).toBe(addDays(TODAY, 30));
  });

  it('P-5E6F7A8B no tiene permisos y un código desconocido no existe', () => {
    const store = createStore();

    expect(store.list('P-5E6F7A8B')).toEqual([]);
    expect(store.list('P-00000000')).toBeNull();
  });

  it('el escenario vacío deja a P-1A2B3C4D sin permisos', () => {
    expect(createStore({ empty: true }).list('P-1A2B3C4D')).toEqual([]);
  });

  it('un permiso que vence hoy sigue vigente hasta el final del día en Bogotá', () => {
    const store = createPermissionStore({
      participants: {
        'P-1A2B3C4D': [
          {
            id_permiso: 'hoy',
            alcance: 'ACCESO_INDIVIDUAL',
            fecha_inicio_vigencia: '2026-11-20T14:00:00.000Z',
            fecha_fin_vigencia: endOfDayInBogota(TODAY),
            revocado_en: null,
          },
        ],
      },
      now: () => NOW,
    });

    expect(store.list('P-1A2B3C4D')).toHaveLength(1);
  });
});

describe('Conceder en la demostración', () => {
  it('crea el permiso con la forma del contrato, con codigo_participante', () => {
    const store = createStore();
    const fin = endOfDayInBogota('2026-11-26');
    const result = store.grant(
      grantRequest('P-5E6F7A8B', 'PROGRESION_NARRATIVA', fin),
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      alcance: 'PROGRESION_NARRATIVA',
      fecha_fin_vigencia: fin,
      vigente: true,
      codigo_participante: 'P-5E6F7A8B',
    });
    expect(result.data).not.toHaveProperty('revocado_en');
    expect(store.list('P-5E6F7A8B')).toHaveLength(1);
  });

  it('409 si ya hay uno vigente con el mismo alcance; el vencido no cuenta', () => {
    const store = createStore();

    expect(
      store.grant(grantRequest('P-1A2B3C4D', 'ACCESO_INDIVIDUAL')),
    ).toEqual({
      ok: false,
      status: 409,
      codigo: 'PERMISO_YA_VIGENTE',
      mensaje: '',
    });
  });

  it('404 con participante desconocido', () => {
    expect(
      createStore().grant(grantRequest('P-00000000', 'ACCESO_INDIVIDUAL')),
    ).toMatchObject({
      status: 404,
      codigo: 'PARTICIPANTE_NO_ENCONTRADO',
    });
  });
});

describe('Revocar en la demostración', () => {
  it('quita el permiso de la lista de vigentes y responde como el contrato', () => {
    const store = createStore();

    expect(store.revoke('demo-permiso-1')).toEqual({
      ok: true,
      data: {
        id_permiso: 'demo-permiso-1',
        vigente: false,
        revocado_en: NOW.toISOString(),
      },
    });
    expect(store.list('P-1A2B3C4D').map(({ id_permiso: id }) => id)).toEqual([
      'demo-permiso-2',
    ]);
  });

  it('409 si ya estaba revocado o vencido', () => {
    const store = createStore();

    expect(store.revoke('demo-permiso-revocado')).toMatchObject({
      status: 409,
      codigo: 'PERMISO_YA_REVOCADO',
    });
    expect(store.revoke('demo-permiso-vencido')).toMatchObject({ status: 409 });
  });

  it('un id inexistente es un error de la demostración', () => {
    expect(() => createStore().revoke('no-existe')).toThrow('inexistente');
  });
});
