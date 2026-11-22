import { describe, expect, it } from 'vitest';

import { toApiError } from './apiError.js';

const conRespuesta = (status, data) => ({ response: { status, data } });

describe('toApiError', () => {
  it('sin respuesta del servidor es SIN_CONEXION y reintentable', () => {
    expect(toApiError(new Error('Network Error'))).toEqual({
      status: null,
      codigo: 'SIN_CONEXION',
      mensaje: '',
      campo: null,
      reintentable: true,
    });
  });

  it('un 400 conserva codigo, mensaje y campo y no es reintentable', () => {
    const data = { codigo: 'FUERA_DE_RANGO', mensaje: 'X', campo: 'valor' };

    expect(toApiError(conRespuesta(400, data))).toEqual({
      status: 400,
      ...data,
      reintentable: false,
    });
  });

  it('un 503 sin cuerpo es DESCONOCIDO y reintentable', () => {
    expect(toApiError(conRespuesta(503))).toMatchObject({
      codigo: 'DESCONOCIDO',
      mensaje: '',
      reintentable: true,
    });
  });

  it('une el message en arreglo de la validación de Nest', () => {
    const error = toApiError(conRespuesta(400, { message: ['a', 'b'] }));

    expect(error.mensaje).toBe('a b');
  });

  it('devuelve igual un error ya normalizado', () => {
    const primero = toApiError(conRespuesta(500, { mensaje: 'Falla' }));

    expect(toApiError(primero)).toBe(primero);
  });

  it('RF-37: conserva el X-Request-Id que devolvió el servidor', () => {
    const error = toApiError({
      response: {
        status: 500,
        headers: { 'x-request-id': 'req-500' },
        data: { codigo: 'ERROR_PERSISTENCIA', mensaje: 'No se pudo guardar.' },
      },
    });

    expect(error).toMatchObject({ status: 500, requestId: 'req-500' });
  });

  it('RF-37: sin respuesta conserva el X-Request-Id enviado', () => {
    const error = toApiError({
      config: { headers: { 'X-Request-Id': 'req-enviado' } },
    });

    expect(error).toMatchObject({
      codigo: 'SIN_CONEXION',
      requestId: 'req-enviado',
    });
  });

  it('RF-37: un 500 solo expone el mensaje seguro, nunca trazas ni SQL', () => {
    const error = toApiError(
      conRespuesta(500, {
        codigo: 'ERROR_PERSISTENCIA',
        mensaje: 'No se pudo guardar tu respuesta. Inténtalo de nuevo.',
        stack: 'Error at /app/src/x.ts:10',
        sql: 'SELECT * FROM chat.sesiones',
      }),
    );

    expect(Object.keys(error).sort()).toEqual(
      ['campo', 'codigo', 'mensaje', 'reintentable', 'status'].sort(),
    );
    expect(JSON.stringify(error)).not.toMatch(/stack|SELECT|\/app\//);
  });
});
