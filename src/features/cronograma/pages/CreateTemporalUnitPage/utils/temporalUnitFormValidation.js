import { parseDateOnly } from '@/shared/utils/dateUtils.js';

export function validateTemporalUnitForm(form) {
  const errors = {};

  const name = form.name.trim();
  const order = Number(form.order);

  if (!name) {
    errors.name = 'El nombre de la unidad es obligatorio.';
  }

  if (!form.order) {
    errors.order = 'El orden de la unidad es obligatorio.';
  } else if (!Number.isInteger(order) || order <= 0) {
    errors.order = 'El orden debe ser un número entero mayor que cero.';
  }

  if (!form.startDate) {
    errors.startDate = 'La fecha de inicio es obligatoria.';
  }

  if (!form.endDate) {
    errors.endDate = 'La fecha de finalización es obligatoria.';
  }

  if (form.startDate && form.endDate) {
    const startDate = parseDateOnly(form.startDate);

    const endDate = parseDateOnly(form.endDate);

    if (startDate !== null && endDate !== null && endDate < startDate) {
      errors.endDate =
        'La fecha de finalización no puede ser anterior a la fecha de inicio.';
    }
  }

  return errors;
}

export function hasTemporalUnitFormErrors(errors) {
  return Object.keys(errors).length > 0;
}
