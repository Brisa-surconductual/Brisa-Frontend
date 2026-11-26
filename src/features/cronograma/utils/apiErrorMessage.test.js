import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './apiErrorMessage.js';

const FALLBACK = 'No pudimos guardar el recurso.';

function backendError(status, message) {
  return {
    isAxiosError: true,
    message: `Request failed with status code ${status}`,
    response: { status, data: { message } },
  };
}

describe('Mensaje de error de API para recursos', () => {
  it('muestra el mensaje string del backend tal cual', () =>
    expect(
      getApiErrorMessage(
        backendError(403, 'El recurso ya está en uso.'),
        FALLBACK,
      ),
    ).toBe('El recurso ya está en uso.'));

  it('une los mensajes cuando el backend envía un arreglo', () =>
    expect(
      getApiErrorMessage(
        backendError(400, [
          'mime_type no es válido',
          'tamano_bytes debe ser mayor que 0',
        ]),
        FALLBACK,
      ),
    ).toBe('mime_type no es válido, tamano_bytes debe ser mayor que 0'));

  it('ignora elementos vacíos o no textuales del arreglo', () =>
    expect(
      getApiErrorMessage(backendError(400, ['', null, 'Falta id_modulos']), FALLBACK),
    ).toBe('Falta id_modulos'));

  it('usa el alternativo si el arreglo no trae detalles', () =>
    expect(getApiErrorMessage(backendError(400, []), FALLBACK)).toBe(FALLBACK));

  it('usa el alternativo si el backend no envía mensaje', () =>
    expect(getApiErrorMessage(backendError(500, undefined), FALLBACK)).toBe(
      FALLBACK,
    ));

  it('no muestra el mensaje técnico de axios en errores de red', () =>
    expect(
      getApiErrorMessage(
        { isAxiosError: true, message: 'Network Error' },
        FALLBACK,
      ),
    ).toBe(FALLBACK));

  it('conserva los errores locales con texto para el usuario', () =>
    expect(
      getApiErrorMessage(
        new Error('El archivo no tiene un tipo MIME válido.'),
        FALLBACK,
      ),
    ).toBe('El archivo no tiene un tipo MIME válido.'));

  it('usa el alternativo ante un error indefinido', () =>
    expect(getApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK));
});
