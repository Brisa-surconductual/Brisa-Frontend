import {
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
  isPsychoeducationalFileResourceType,
} from '@/features/cronograma/types/resourceTypes.js';

const VALID_RESOURCE_TYPES = Object.values(
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
);

export function validatePsychoeducationalResourceForm(form) {
  const errors = {};

  if (
    !form.type ||
    !VALID_RESOURCE_TYPES.includes(form.type)
  ) {
    errors.type = 'Selecciona un tipo de recurso válido.';
  }

  const normalizedOrder = String(form.order ?? '').trim();

  if (!normalizedOrder) {
    errors.order = 'El orden del bloque es obligatorio.';
  } else {
    const order = Number(normalizedOrder);

    if (!Number.isInteger(order) || order < 1) {
      errors.order =
        'El orden debe ser un número entero mayor o igual a 1.';
    }
  }

  if (
    form.type === PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO &&
    !String(form.textContent ?? '').trim()
  ) {
    errors.textContent =
      'El contenido de texto es obligatorio.';
  }

  if (
    isPsychoeducationalFileResourceType(form.type) &&
    !form.file &&
    !String(form.storageKey ?? '').trim()
  ) {
    errors.file =
      'Selecciona un archivo para este recurso.';
  }

  if (
  !Array.isArray(form.moduleIds) ||
  form.moduleIds.length === 0
  ) {
    errors.moduleIds =
      'Selecciona al menos un módulo destino.';
  }

  return errors;
}

export function hasPsychoeducationalResourceFormErrors(
  errors,
) {
  return Object.keys(errors).length > 0;
}