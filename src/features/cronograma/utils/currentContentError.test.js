import { describe, expect, it } from 'vitest';
import { currentContentError } from './currentContentError.js';
describe('Diagnóstico del contenido del estudiante', () => {
  it('explica el cronograma asignado sin planificación sin presentarlo como contenido vacío', () => {
    expect(
      currentContentError({
        response: {
          status: 422,
          data: {
            message: 'El cronograma no tiene unidades temporales definidas.',
          },
        },
      }),
    ).toContain('planificación aún no está completa');
  });
  it('no oculta otros errores 422', () => {
    expect(
      currentContentError({
        response: { status: 422, data: { message: 'Otro error' } },
      }),
    ).toContain('No pudimos consultar');
  });
  it('distingue la sesión vencida', () => {
    expect(currentContentError({ response: { status: 401 } })).toContain(
      'Tu sesión terminó',
    );
  });
});
