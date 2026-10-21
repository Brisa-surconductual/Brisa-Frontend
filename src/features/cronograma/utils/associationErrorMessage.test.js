import { describe, expect, it } from 'vitest';
import { associationErrorMessage } from './associationErrorMessage.js';
describe('Motivo real del rechazo de asociación', () => {
  it('muestra el motivo 409 enviado por el backend', () =>
    expect(
      associationErrorMessage({
        response: {
          status: 409,
          data: { message: 'La disponibilidad está fuera del rango.' },
        },
      }),
    ).toBe('La disponibilidad está fuera del rango.'));
  it('distingue la sesión vencida del conflicto', () =>
    expect(associationErrorMessage({ response: { status: 401 } })).toContain(
      'Tu sesión terminó',
    ));
});
