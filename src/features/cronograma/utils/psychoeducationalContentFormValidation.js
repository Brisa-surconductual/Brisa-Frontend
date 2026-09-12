import { PSYCHOEDUCATIONAL_CONTENT_TYPE } from '@/features/cronograma/types/contentTypes.js';

const VALID_CONTENT_TYPES = new Set(
  Object.values(PSYCHOEDUCATIONAL_CONTENT_TYPE),
);

export function validatePsychoeducationalContentForm(form) {
  const errors = {};

  const name = form.name.trim();

  if (!name) {
    errors.name = 'El nombre del contenido es obligatorio.';
  }

  if (!form.type) {
    errors.type = 'El tipo de contenido es obligatorio.';
  } else if (!VALID_CONTENT_TYPES.has(form.type)) {
    errors.type = 'Selecciona un tipo de contenido válido.';
  }

  return errors;
}

export function hasPsychoeducationalContentFormErrors(errors) {
  return Object.keys(errors).length > 0;
}
