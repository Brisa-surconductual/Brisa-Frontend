import { describe, expect, it } from 'vitest';

import {
  READ_ONLY_ERROR_CODE,
  READ_ONLY_HTTP_STATUS,
  READ_ONLY_MESSAGE,
} from '../types/readOnlyRestriction.js';
import { getReadOnlyMessage, isReadOnlyRejection } from './readOnlyRestriction.js';

// Forma de un error de axios 1.x: `status` replica `response.status`
// y `code` lleva un código propio de axios.
function axiosError(status, data, code = 'ERR_BAD_REQUEST') {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    code,
    status,
    response: { status, data },
  });
}

describe('Constantes de RF-148', () => {
  it('estado 403, código ESCRITURA_NO_PERMITIDA y mensaje uniforme', () => {
    expect(READ_ONLY_HTTP_STATUS).toBe(403);
    expect(READ_ONLY_ERROR_CODE).toBe('ESCRITURA_NO_PERMITIDA');
    expect(READ_ONLY_MESSAGE).toBe('Esta información es de solo lectura para el rol administrativo.');
  });
});

describe('isReadOnlyRejection: reconoce el rechazo estructurado', () => {
  it('1. HTTP 403 con ESCRITURA_NO_PERMITIDA en el cuerpo (error de axios)', () => {
    expect(isReadOnlyRejection(axiosError(403, { status: 403, codigo: 'ESCRITURA_NO_PERMITIDA', message: 'x' }))).toBe(true);
  });

  it('2. código en error.code, con estado en error.status', () => {
    expect(isReadOnlyRejection({ status: 403, code: 'ESCRITURA_NO_PERMITIDA' })).toBe(true);
  });

  it('3. código en error.response.data.codigo, con estado en error.response.status', () => {
    expect(isReadOnlyRejection({ response: { status: 403, data: { codigo: 'ESCRITURA_NO_PERMITIDA' } } })).toBe(true);
  });
});

describe('isReadOnlyRejection: no confunde otros errores', () => {
  it('4. HTTP 403 sin ese código (CSRF, acceso al módulo RF-122, otro código)', () => {
    expect(isReadOnlyRejection(axiosError(403, { message: 'Token CSRF inválido' }))).toBe(false);
    expect(isReadOnlyRejection(axiosError(403, { codigo: 'ACCESO_DENEGADO', message: 'No tiene permisos para acceder al módulo administrativo.' }))).toBe(false);
    expect(isReadOnlyRejection(axiosError(403, ''))).toBe(false);
  });

  it.each([
    ['5. HTTP 401', 401],
    ['6. HTTP 400', 400],
    ['7. HTTP 500', 500],
  ])('%s, aunque traiga el código', (_, status) => {
    expect(isReadOnlyRejection(axiosError(status, { codigo: 'ESCRITURA_NO_PERMITIDA' }))).toBe(false);
  });

  it('8. un mensaje que contiene el código, sin código estructurado', () => {
    expect(isReadOnlyRejection(axiosError(403, { message: 'ESCRITURA_NO_PERMITIDA' }))).toBe(false);
    expect(isReadOnlyRejection(Object.assign(new Error('ESCRITURA_NO_PERMITIDA'), { status: 403 }))).toBe(false);
    expect(isReadOnlyRejection({ status: 403, message: 'Esta información es de solo lectura para el rol administrativo.' })).toBe(false);
  });

  it('9. código correcto con un estado distinto de 403', () => {
    expect(isReadOnlyRejection({ status: 409, code: 'ESCRITURA_NO_PERMITIDA' })).toBe(false);
    expect(isReadOnlyRejection({ response: { status: 422, data: { codigo: 'ESCRITURA_NO_PERMITIDA' } } })).toBe(false);
  });

  it('10. código sin ningún estado HTTP verificable', () => {
    expect(isReadOnlyRejection({ code: 'ESCRITURA_NO_PERMITIDA' })).toBe(false);
    expect(isReadOnlyRejection({ response: { data: { codigo: 'ESCRITURA_NO_PERMITIDA' } } })).toBe(false);
    expect(isReadOnlyRejection({ status: '403', code: 'ESCRITURA_NO_PERMITIDA' })).toBe(false);
  });

  it('estados contradictorios no son verificables', () => {
    expect(isReadOnlyRejection({ status: 403, response: { status: 401, data: { codigo: 'ESCRITURA_NO_PERMITIDA' } } })).toBe(false);
  });

  it('el código del servidor manda sobre error.code', () => {
    expect(isReadOnlyRejection(axiosError(403, { codigo: 'OTRO' }, 'ESCRITURA_NO_PERMITIDA'))).toBe(false);
    expect(isReadOnlyRejection(axiosError(403, { codigo: 7 }, 'ESCRITURA_NO_PERMITIDA'))).toBe(false);
  });

  it('11. error nulo, indefinido o que no es objeto', () => {
    for (const value of [null, undefined, 'ESCRITURA_NO_PERMITIDA', 403, true]) {
      expect(isReadOnlyRejection(value)).toBe(false);
    }
  });

  it('un error de red sin respuesta', () => {
    expect(isReadOnlyRejection(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }))).toBe(false);
  });
});

describe('getReadOnlyMessage', () => {
  it('12. devuelve siempre el mensaje uniforme, sin depender del error', () => {
    expect(getReadOnlyMessage()).toBe('Esta información es de solo lectura para el rol administrativo.');
  });
});
