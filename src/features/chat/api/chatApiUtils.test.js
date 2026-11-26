import { describe, expect, it } from 'vitest';

import { toApiError } from '@/shared/utils/apiError.js';

import { conIdPeticion, toChatApiError } from './chatApiUtils.js';

describe('chatApiUtils (RF-37)', () => {
  it('un error HTTP ya normalizado no se confunde con una caída de red', () => {
    const normalizado = toApiError({
      response: {
        status: 409,
        headers: { 'x-request-id': 'req-409' },
        data: { codigo: 'ESTADO_INCONSISTENTE', mensaje: 'Inconsistente.' },
      },
    });

    expect(toChatApiError(normalizado)).toMatchObject({
      code: 'ESTADO_INCONSISTENTE',
      status: 409,
      backendMessage: 'Inconsistente.',
      requestId: 'req-409',
    });
  });

  it('sin respuesta es SIN_CONEXION y conserva el id enviado', () => {
    expect(
      toChatApiError({ config: { headers: { 'X-Request-Id': 'req-1' } } }),
    ).toMatchObject({ code: 'SIN_CONEXION', status: null, requestId: 'req-1' });
  });

  it('conIdPeticion agrega un X-Request-Id distinto sin perder la configuración', () => {
    const a = conIdPeticion({ params: { limite: 5 } });
    const b = conIdPeticion();

    expect(a.params).toEqual({ limite: 5 });
    expect(a.headers['X-Request-Id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(b.headers['X-Request-Id']).not.toBe(a.headers['X-Request-Id']);
  });
});
