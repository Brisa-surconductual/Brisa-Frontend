import { describe, expect, it } from 'vitest';

import { getApiErrorText } from './apiErrorText.js';

const FALLBACK = 'No pudimos confirmar el registro. Intenta nuevamente.';

const axiosError = (status, data) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  });

describe('getApiErrorText (registro)', () => {
  it('muestra el mensaje del backend tal cual', () => {
    expect(getApiErrorText(axiosError(409, { message: 'El correo ya está registrado.' }), FALLBACK))
      .toBe('El correo ya está registrado.');
  });

  it('une los mensajes de validación en una frase', () => {
    expect(
      getApiErrorText(axiosError(400, { message: ['La edad es obligatoria.', 'El semestre no es válido.'] }), FALLBACK),
    ).toBe('La edad es obligatoria., El semestre no es válido.');
  });

  it('nunca muestra el nombre del estado HTTP en inglés (data.error)', () => {
    expect(getApiErrorText(axiosError(400, { statusCode: 400, error: 'Bad Request' }), FALLBACK)).toBe(FALLBACK);
  });

  it('nunca muestra el mensaje técnico de axios', () => {
    const network = Object.assign(new Error('Network Error'), { isAxiosError: true });

    expect(getApiErrorText(network, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorText(axiosError(500, {}), FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorText(axiosError(502, '<html>Bad Gateway</html>'), FALLBACK)).toBe(FALLBACK);
  });

  it('conserva los mensajes propios lanzados localmente', () => {
    expect(getApiErrorText(new Error('Debes aceptar ambas autorizaciones para continuar.'), FALLBACK))
      .toBe('Debes aceptar ambas autorizaciones para continuar.');
  });

  it('sin error ni mensaje usa el respaldo', () => {
    expect(getApiErrorText(undefined, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorText(axiosError(400, { message: '   ' }), FALLBACK)).toBe(FALLBACK);
  });
});
