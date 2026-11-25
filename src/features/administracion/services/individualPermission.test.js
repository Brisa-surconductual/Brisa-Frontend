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

const ID = '11111111-1111-4111-8111-111111111111';
const BENEFICIARY = '22222222-2222-4222-8222-222222222222';

const raw = (overrides = {}) => ({
  id_permiso: ID,
  alcance: 'ACCESO_INDIVIDUAL',
  fecha_inicio_vigencia: '2026-11-25T15:04:00.000Z',
  fecha_fin_vigencia: '2026-12-02T04:59:59.000Z',
  vigente: true,
  revocado_en: null,
  id_usuario_beneficiario: BENEFICIARY,
  ...overrides,
});

describe('normalizePermiso', () => {
  it('convierte el elemento del contrato y lo congela', () => {
    const permiso = normalizePermiso(raw());

    expect(permiso).toEqual({
      id: ID,
      scope: PERMISSION_SCOPE.INDIVIDUAL_ACCESS,
      active: true,
      startsAt: '2026-11-25T15:04:00.000Z',
      endsAt: '2026-12-02T04:59:59.000Z',
      endDate: '2026-12-01',
      revokedAt: null,
      beneficiaryId: BENEFICIARY,
      beneficiaryName: null,
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

  it('acepta el 201 de la concesión: sin beneficiario ni revocado_en', () => {
    const created = raw();
    delete created.id_usuario_beneficiario;
    delete created.revocado_en;

    const permiso = normalizePermiso(created);

    expect(permiso.beneficiaryId).toBeNull();
    expect(permiso.revokedAt).toBeNull();
  });

  it('lee revocado_en cuando viene', () => {
    expect(
      normalizePermiso(raw({ revocado_en: '2026-11-25T16:00:00.000Z' }))
        .revokedAt,
    ).toBe('2026-11-25T16:00:00.000Z');
  });

  it.each([
    ['sin id', { id_permiso: '' }],
    ['con id que no es UUID (D27)', { id_permiso: 'perm-1' }],
    ['con alcance fuera de catálogo', { alcance: 'TOTAL' }],
    ['sin vigente', { vigente: undefined }],
    ['con vigente que no es booleano', { vigente: 'true' }],
    ['con inicio inválido', { fecha_inicio_vigencia: 'ayer' }],
    ['con fin inválido', { fecha_fin_vigencia: '31/12/2026' }],
    ['con revocado_en inválido', { revocado_en: 'ayer' }],
    ['con beneficiario que no es UUID', { id_usuario_beneficiario: 'ana' }],
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

    expect(result.permissions.map((p) => p.id)).toEqual([ID]);
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
    beneficiaryId: BENEFICIARY,
  });

  it('exige el alcance y el beneficiario', () => {
    expect(
      validatePermissionForm(
        { scope: '', endDate: '', beneficiaryId: '' },
        tomorrow,
      ),
    ).toEqual({
      scope: PERMISSION_FORM_MESSAGE.SCOPE_REQUIRED,
      beneficiaryId: PERMISSION_FORM_MESSAGE.BENEFICIARY_REQUIRED,
    });
  });

  it('rechaza un beneficiario que no es UUID', () => {
    expect(
      validatePermissionForm({ ...form(''), beneficiaryId: 'ana' }, tomorrow),
    ).toEqual({
      beneficiaryId: PERMISSION_FORM_MESSAGE.BENEFICIARY_REQUIRED,
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
        beneficiaryId: BENEFICIARY,
      }),
    ).toEqual({
      codigo_participante: 'P-1A2B3C4D',
      alcance: 'ACCESO_INDIVIDUAL',
      fecha_fin_vigencia: '2026-12-31T04:59:59.000Z',
      id_usuario_beneficiario: BENEFICIARY,
    });
  });

  it('ida y vuelta: el instante enviado se vuelve a mostrar como el día elegido', () => {
    const sent = toGrantRequest('P-1A2B3C4D', {
      scope: 'ACCESO_INDIVIDUAL',
      endDate: '2026-12-30',
      beneficiaryId: BENEFICIARY,
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
        beneficiaryId: BENEFICIARY,
      }),
    ).toEqual({
      codigo_participante: 'P-1A2B3C4D',
      alcance: 'PROGRESION_NARRATIVA',
      fecha_fin_vigencia: null,
      id_usuario_beneficiario: BENEFICIARY,
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

  it.each([
    ['VIGENCIA_INVALIDA', 'endDate'],
    ['AUTOCONCESION_NO_PERMITIDA', 'beneficiaryId'],
    ['ROL_INVALIDO_PARA_OPERACION', 'beneficiaryId'],
  ])(
    'ubica %s junto al campo %s con el mensaje del backend',
    (codigo, field) => {
      expect(
        readGrantError({ status: 422, codigo, mensaje: 'Del backend.' }),
      ).toEqual({ field, message: 'Del backend.' });
    },
  );

  it('sin mensaje usa el texto de respaldo del código', () => {
    expect(
      readGrantError({ status: 422, codigo: 'AUTOCONCESION_NO_PERMITIDA' }),
    ).toEqual({
      field: 'beneficiaryId',
      message: 'No puedes concederte un permiso a ti mismo.',
    });
  });

  it('lo no reconocido y la falta de conexión van al aviso general', () => {
    expect(
      readGrantError({
        status: 422,
        codigo: 'ERROR_PERSISTENCIA_PERMISOS',
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

describe('readGrantError: casos sin codigo del backend (D28)', () => {
  const GENERIC = 'No se pudo completar la operación con el permiso.';

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('con %s usa el texto genérico en el aviso general', (_, error) => {
    expect(readGrantError(error)).toEqual({ field: null, message: GENERIC });
  });

  it('un mensaje en blanco usa el texto de respaldo del código', () => {
    expect(
      readGrantError({ codigo: 'PERMISO_YA_VIGENTE', mensaje: '   ' }),
    ).toEqual({
      field: 'scope',
      message: 'Ya hay un permiso vigente con este alcance.',
    });
  });

  it('PERMISO_YA_VIGENTE sin mensaje usa el respaldo y el campo alcance', () => {
    expect(readGrantError({ codigo: 'PERMISO_YA_VIGENTE' })).toEqual({
      field: 'scope',
      message: 'Ya hay un permiso vigente con este alcance.',
    });
  });

  it('un código desconocido sin mensaje usa el texto genérico', () => {
    expect(readGrantError({ codigo: 'OTRO', mensaje: '' })).toEqual({
      field: null,
      message: GENERIC,
    });
  });

  it('el 400 de Nest (DESCONOCIDO con texto en inglés) no se muestra', () => {
    expect(
      readGrantError({
        status: 400,
        codigo: 'DESCONOCIDO',
        mensaje: 'id_usuario_beneficiario must be a UUID',
      }),
    ).toEqual({ field: null, message: GENERIC });
  });

  it('el 500 ERROR_PERSISTENCIA_PERMISOS con mensaje sí se muestra', () => {
    expect(
      readGrantError({
        status: 500,
        codigo: 'ERROR_PERSISTENCIA_PERMISOS',
        mensaje: 'No fue posible completar la operación.',
      }),
    ).toEqual({
      field: null,
      message: 'No fue posible completar la operación.',
    });
  });
});

describe('Listado: solo vigentes y marcas con zona (D29, D31)', () => {
  it('descarta y cuenta un elemento con vigente false', () => {
    const result = normalizePermissionList([
      raw(),
      raw({
        id_permiso: '33333333-3333-4333-8333-333333333333',
        vigente: false,
      }),
    ]);

    expect(result.permissions).toHaveLength(1);
    expect(result.discarded).toBe(1);
  });

  it('normalizePermiso sí acepta vigente false (el 201 y los datos)', () => {
    expect(normalizePermiso(raw({ vigente: false })).active).toBe(false);
  });

  it.each([['1'], ['2026'], ['2026-11-25T15:04:00'], ['2026-11-25']])(
    'rechaza la marca %s (sin ISO con zona)',
    (value) => {
      expect(() =>
        normalizePermiso(raw({ fecha_inicio_vigencia: value })),
      ).toThrow();
      expect(() =>
        normalizePermiso(raw({ fecha_fin_vigencia: value })),
      ).toThrow();
    },
  );
});
