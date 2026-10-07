import { expect, it } from 'vitest';

import { validarRespuesta } from './validacionRespuesta.js';

const rechaza = () => 'OPCION_NO_VALIDA';

it.each([null, undefined, '', '  ', []])(
  'vacía (%j): obligatoria falla, opcional es null válido',
  (vacia) => {
    expect(validarRespuesta({ obligatorio: true }, vacia, rechaza)).toEqual({
      valido: false,
      codigo: 'RESPUESTA_OBLIGATORIA',
      mensaje: 'Este campo es obligatorio.',
    });
    expect(validarRespuesta({ obligatorio: false }, vacia, rechaza)).toEqual({
      valido: true,
      respuesta: null,
    });
  },
);

it('usa el código del tipo y `mensaje_error` reemplaza al genérico', () => {
  expect(validarRespuesta({}, 'x', rechaza).mensaje).toBe(
    'La respuesta seleccionada no es válida para esta pregunta.',
  );
  expect(
    validarRespuesta({ mensaje_error: 'Elige otra.' }, 'x', rechaza),
  ).toEqual({
    valido: false,
    codigo: 'OPCION_NO_VALIDA',
    mensaje: 'Elige otra.',
  });
  expect(validarRespuesta({}, 'x', () => null)).toEqual({
    valido: true,
    respuesta: 'x',
  });
});
