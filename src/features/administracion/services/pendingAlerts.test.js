import { describe, expect, it } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { ATTEND_OUTCOME as O, PENDING_ALERTS_STATUS as S } from '../types/pendingAlerts.js';

import {
  InvalidPendingAlertsResponse,
  classifyAttendError,
  classifyPendingAlertsError,
  interpretPendingAlerts,
  isOutOfRange,
  lastPageOffset,
  pageInfo,
  validateAttendReason,
} from './pendingAlerts.js';

const item = (n, changes = {}) => ({
  id_alerta: `a0000000-0000-4000-8000-00000000000${n}`,
  tipo_alerta: 'CRAVING_ELEVADO',
  fecha_generacion: '2026-11-12T22:15:00Z',
  codigo_participante: 'P-BBBBBBBB',
  ...changes,
});

const httpError = (status, codigo, mensaje = '') =>
  toApiError({ response: { status, data: { status, codigo, mensaje } } });

describe('interpretPendingAlerts', () => {
  it('transforma solo los campos del contrato y conserva el orden del servidor', () => {
    const page = interpretPendingAlerts({
      items: [item(3, { extra: 'x' }), item(1, { tipo_alerta: 'INACTIVIDAD' })],
      total: 2,
      offset: 0,
      limit: 20,
    });

    expect(page).toEqual({
      items: [
        { id: item(3).id_alerta, type: 'CRAVING_ELEVADO', generatedAt: '2026-11-12T22:15:00Z', participantCode: 'P-BBBBBBBB' },
        { id: item(1).id_alerta, type: 'INACTIVIDAD', generatedAt: '2026-11-12T22:15:00Z', participantCode: 'P-BBBBBBBB' },
      ],
      total: 2,
      offset: 0,
      limit: 20,
    });
  });

  it('conserva los datos originales: no modifica el cuerpo recibido', () => {
    const body = { items: [item(1)], total: 1, offset: 0, limit: 20 };
    const copy = structuredClone(body);

    interpretPendingAlerts(body);

    expect(body).toEqual(copy);
  });

  it.each([
    ['sin items', { total: 1, offset: 0, limit: 20 }],
    ['total negativo', { items: [], total: -1, offset: 0, limit: 20 }],
    ['limit 0', { items: [], total: 0, offset: 0, limit: 0 }],
    ['elemento incompleto', { items: [item(1, { codigo_participante: '' })], total: 1, offset: 0, limit: 20 }],
    ['nulo', null],
  ])('respuesta inválida (%s): no se presenta a medias', (_, body) => {
    expect(() => interpretPendingAlerts(body)).toThrow(InvalidPendingAlertsResponse);
  });
});

describe('paginación', () => {
  it('última página que existe', () => {
    expect(lastPageOffset(41, 20)).toBe(40);
    expect(lastPageOffset(40, 20)).toBe(20);
    expect(lastPageOffset(1, 20)).toBe(0);
    expect(lastPageOffset(0, 20)).toBe(0);
  });

  it('página fuera de rango: lista vacía con total > 0', () => {
    expect(isOutOfRange({ items: [], total: 3 })).toBe(true);
    expect(isOutOfRange({ items: [], total: 0 })).toBe(false);
  });

  it('rango y navegación', () => {
    expect(pageInfo({ items: [1, 2], total: 22, offset: 20, limit: 20 })).toEqual({
      range: { from: 21, to: 22 },
      pageNumber: 2,
      pageCount: 2,
      canGoBack: true,
      canGoForward: false,
    });
  });
});

describe('classifyPendingAlertsError', () => {
  it.each([
    [httpError(400, 'X'), S.INVALID_REQUEST, false],
    [httpError(401, 'NO_AUTENTICADO'), S.UNAUTHENTICATED, false],
    [httpError(403, 'ACCESO_DENEGADO'), S.DENIED, false],
    [httpError(404, 'COHORTE_NO_ENCONTRADA'), S.COHORT_NOT_FOUND, false],
    [httpError(503, 'M05_NO_DISPONIBLE'), S.SOURCE_UNAVAILABLE, true],
    [httpError(500, 'ERROR_TRANSACCION'), S.SERVER_ERROR, true],
    [toApiError(new Error('Network Error')), S.CONNECTION_ERROR, true],
    [new InvalidPendingAlertsResponse(), S.INVALID_RESPONSE, true],
  ])('%o → %s', (error, status, canRetry) => {
    expect(classifyPendingAlertsError(error)).toMatchObject({ status, canRetry });
  });

  it('conserva el mensaje del backend', () => {
    expect(classifyPendingAlertsError(httpError(404, 'COHORTE_NO_ENCONTRADA', 'La cohorte no existe.')).message)
      .toBe('La cohorte no existe.');
  });
});

describe('validateAttendReason', () => {
  it.each([
    ['', 'Escribe el motivo de la atención.'],
    ['          ', 'Escribe el motivo de la atención.'],
    ['123456789', 'El motivo debe tener al menos 10 caracteres.'],
    [`  ${'a'.repeat(9)}  `, 'El motivo debe tener al menos 10 caracteres.'],
    ['a'.repeat(501), 'El motivo no puede superar los 500 caracteres.'],
  ])('%j no es válido', (text, error) => {
    expect(validateAttendReason(text).error).toBe(error);
  });

  it.each(['a'.repeat(10), 'a'.repeat(500), `   ${'a'.repeat(500)}   `])('límites válidos tras recortar', (text) => {
    expect(validateAttendReason(text)).toEqual({ value: text.trim(), error: '' });
  });
});

describe('classifyAttendError', () => {
  it.each([
    [httpError(409, 'ALERTA_YA_ATENDIDA'), O.ALREADY_ATTENDED, { refresh: true, keepDialog: false, requiresRefresh: false }],
    [httpError(409, 'ALERTA_NO_ACTIVA'), O.NOT_ACTIVE, { refresh: true, keepDialog: false }],
    [httpError(404, 'ALERTA_NO_ENCONTRADA'), O.NOT_FOUND, { refresh: true, keepDialog: false }],
    [httpError(422, 'MOTIVO_INVALIDO'), O.INVALID_REASON, { keepDialog: true, refresh: false }],
    [httpError(400, undefined), O.INVALID_REASON, { keepDialog: true }],
    [httpError(503, 'M05_NO_DISPONIBLE'), O.SOURCE_UNAVAILABLE, { keepDialog: true, refresh: false }],
    [httpError(500, 'ERROR_TRANSACCION'), O.UNCONFIRMED, { requiresRefresh: true, keepDialog: false }],
    [httpError(502, undefined), O.UNCONFIRMED, { requiresRefresh: true }],
    [toApiError(new Error('Network Error')), O.UNCONFIRMED, { requiresRefresh: true }],
    [httpError(401, undefined), O.UNAUTHENTICATED, {}],
    [httpError(403, 'ACCESO_DENEGADO'), O.DENIED, { keepDialog: false }],
  ])('%o → %s', (error, outcome, flags) => {
    expect(classifyAttendError(error)).toMatchObject({ outcome, ...flags });
  });

  it('usa el mensaje del backend y, sin él, un respaldo propio', () => {
    expect(classifyAttendError(httpError(500, 'ERROR_TRANSACCION', 'No fue posible registrar la acción.')).message)
      .toBe('No fue posible registrar la acción.');
    expect(classifyAttendError(httpError(409, 'ALERTA_YA_ATENDIDA')).message)
      .toBe('La alerta ya estaba registrada como atendida.');
  });

  it('sin respuesta nunca afirma éxito ni fracaso', () => {
    expect(classifyAttendError(toApiError(new Error('Network Error'))).message).toMatch(/no sabemos si la atención quedó registrada/);
  });
});
