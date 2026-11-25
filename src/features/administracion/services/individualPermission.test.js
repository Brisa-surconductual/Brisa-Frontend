import { describe, expect, it } from 'vitest';

import { PERMISSION_SCOPE } from '../types/permissionScope.js';
import { PERMISSION_FORM_MESSAGE } from '../utils/individualPermissionMessages.js';
import {
  endOfDayInBogota,
  normalizePermiso,
  normalizePermissionList,
  readGrantError,
  toGrantRequest,
  validatePermissionForm,
} from './individualPermission.js';

const raw = (overrides = {}) => ({
  id_permiso: 'perm-1',
  alcance: 'ACCESO_INDIVIDUAL',
  fecha_inicio_vigencia: '2026-11-25T15:04:00.000Z',
  fecha_fin_vigencia: '2026-12-02T04:59:59.000Z',
  vigente: true,
  ...overrides,
});

describe('normalizePermiso', () => {
  it('convierte el elemento del contrato y lo congela', () => {
    const permiso = normalizePermiso(raw());

    expect(permiso).toEqual({
      id: 'perm-1',
      scope: PERMISSION_SCOPE.INDIVIDUAL_ACCESS,
      active: true,
      startsAt: '2026-11-25T15:04:00.000Z',
      endsAt: '2026-12-02T04:59:59.000Z',
      endDate: '2026-12-01',
      grantedAt: null,
      holder: null,
    });
    expect(Object.isFrozen(permiso)).toBe(true);
  });

  it('muestra el fin como fecha de Bogotá, sin el error de un día', () => {
    // Cortar el ISO daría el 2 de diciembre; en Bogotá son las 23:59 del 1.
    expect(normalizePermiso(raw()).endDate).toBe('2026-12-01');
    expect(
      normalizePermiso(raw({ fecha_fin_vigencia: '2027-01-01T04:59:59.000Z' }))
        .endDate,
    ).toBe('2026-12-31');
    expect(
      normalizePermiso(raw({ fecha_fin_vigencia: '2026-12-01T23:59:59.000Z' }))
        .endDate,
    ).toBe('2026-12-01');
  });

  it('acepta un permiso sin vencimiento', () => {
    const permiso = normalizePermiso(raw({ fecha_fin_vigencia: null }));

    expect(permiso.endsAt).toBeNull();
    expect(permiso.endDate).toBeNull();
  });

  it('lee vigente tal cual', () => {
    expect(normalizePermiso(raw({ vigente: false })).active).toBe(false);
  });

  it('expone titular y otorgado_en cuando vienen (opcionales, D21)', () => {
    const permiso = normalizePermiso(
      raw({
        otorgado_en: '2026-11-25T15:04:00.000Z',
        titular: { id: 'a-1', nombre: 'Ana' },
      }),
    );

    expect(permiso.grantedAt).toBe('2026-11-25T15:04:00.000Z');
    expect(permiso.holder).toEqual({ id: 'a-1', name: 'Ana' });
  });

  it.each([
    ['sin id', { id_permiso: '' }],
    ['con alcance fuera de catálogo', { alcance: 'TOTAL' }],
    ['sin vigente', { vigente: undefined }],
    ['con vigente que no es booleano', { vigente: 'true' }],
    ['con inicio inválido', { fecha_inicio_vigencia: 'ayer' }],
    ['con fin inválido', { fecha_fin_vigencia: '31/12/2026' }],
    ['con otorgado_en inválido', { otorgado_en: 'ayer' }],
    ['con titular sin nombre', { titular: { id: 'a-1', nombre: '' } }],
  ])('rechaza un permiso %s', (_, overrides) => {
    expect(() => normalizePermiso(raw(overrides))).toThrow();
  });

  it('rechaza lo que no es un objeto', () => {
    expect(() => normalizePermiso(null)).toThrow();
  });
});

describe('normalizePermissionList', () => {
  it('descarta los elementos inválidos sin romper la lista', () => {
    const result = normalizePermissionList([
      raw(),
      raw({ alcance: 'X' }),
      null,
    ]);

    expect(result.permissions.map((p) => p.id)).toEqual(['perm-1']);
    expect(result.discarded).toBe(2);
  });

  it('si descarta todo, informa los descartados en lugar de una lista vacía', () => {
    expect(normalizePermissionList([raw({ vigente: null })])).toEqual({
      permissions: [],
      discarded: 1,
    });
  });

  it('rechaza una respuesta que no es lista', () => {
    expect(() => normalizePermissionList(undefined)).toThrow('no es válido');
    expect(() => normalizePermissionList({ items: [] })).toThrow(
      'no es válido',
    );
  });
});

describe('validatePermissionForm', () => {
  const tomorrow = '2026-11-26';
  const form = (endDate) => ({
    scope: PERMISSION_SCOPE.INDIVIDUAL_ACCESS,
    endDate,
  });

  it('exige el alcance', () => {
    expect(
      validatePermissionForm({ scope: '', endDate: '' }, tomorrow),
    ).toEqual({
      scope: PERMISSION_FORM_MESSAGE.SCOPE_REQUIRED,
    });
  });

  it('permite la fecha vacía y la de mañana', () => {
    expect(validatePermissionForm(form(''), tomorrow)).toEqual({});
    expect(validatePermissionForm(form(tomorrow), tomorrow)).toEqual({});
  });

  it('rechaza hoy y las fechas imposibles', () => {
    expect(validatePermissionForm(form('2026-11-25'), tomorrow)).toEqual({
      endDate: PERMISSION_FORM_MESSAGE.END_DATE_TOO_EARLY,
    });
    expect(validatePermissionForm(form('2026-11-31'), tomorrow)).toEqual({
      endDate: PERMISSION_FORM_MESSAGE.END_DATE_INVALID,
    });
  });
});

describe('toGrantRequest', () => {
  it('envía el final del día elegido en Bogotá como instante ISO', () => {
    // 2026-12-30T23:59:59-05:00 = 2026-12-31T04:59:59Z.
    expect(endOfDayInBogota('2026-12-30')).toBe('2026-12-31T04:59:59.000Z');
    expect(endOfDayInBogota('2026-12-31')).toBe('2027-01-01T04:59:59.000Z');

    expect(
      toGrantRequest('P-1A2B3C4D', {
        scope: 'ACCESO_INDIVIDUAL',
        endDate: '2026-12-30',
      }),
    ).toEqual({
      codigo_participante: 'P-1A2B3C4D',
      alcance: 'ACCESO_INDIVIDUAL',
      fecha_fin_vigencia: '2026-12-31T04:59:59.000Z',
    });
  });

  it('ida y vuelta: el instante enviado se vuelve a mostrar como el día elegido', () => {
    const sent = toGrantRequest('P-1A2B3C4D', {
      scope: 'ACCESO_INDIVIDUAL',
      endDate: '2026-12-30',
    });

    expect(
      normalizePermiso(raw({ fecha_fin_vigencia: sent.fecha_fin_vigencia }))
        .endDate,
    ).toBe('2026-12-30');
  });

  it('envía la fecha vacía como null', () => {
    expect(
      toGrantRequest('P-1A2B3C4D', {
        scope: 'PROGRESION_NARRATIVA',
        endDate: '',
      }),
    ).toEqual({
      codigo_participante: 'P-1A2B3C4D',
      alcance: 'PROGRESION_NARRATIVA',
      fecha_fin_vigencia: null,
    });
  });
});

describe('readGrantError', () => {
  it('ubica PERMISO_YA_VIGENTE junto al alcance con el mensaje del backend', () => {
    expect(
      readGrantError({
        status: 409,
        codigo: 'PERMISO_YA_VIGENTE',
        mensaje: 'Ya existe.',
      }),
    ).toEqual({ field: 'scope', message: 'Ya existe.' });
  });

  it('lleva la autoconcesión al aviso general', () => {
    expect(
      readGrantError({
        status: 422,
        codigo: 'AUTOCONCESION_NO_PERMITIDA',
        mensaje: '',
      }),
    ).toEqual({
      field: null,
      message: 'No puedes concederte un permiso a ti mismo.',
    });
  });

  it('lo no reconocido y la falta de conexión van al aviso general', () => {
    expect(
      readGrantError({
        status: 422,
        codigo: 'FECHA_FIN_INVALIDA',
        mensaje: 'x',
      }),
    ).toEqual({
      field: null,
      message: 'x',
    });
    expect(readGrantError({ codigo: 'SIN_CONEXION', mensaje: '' })).toEqual({
      field: null,
      message: 'No hay conexión con el servidor. Inténtalo de nuevo.',
    });
  });
});
