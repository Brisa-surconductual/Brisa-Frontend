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
});
