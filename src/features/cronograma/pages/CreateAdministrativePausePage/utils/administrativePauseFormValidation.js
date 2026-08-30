import { parseDateOnly } from '@/shared/utils/dateUtils.js';

export function validateAdministrativePauseForm(form) {
  const errors = {};

  if (!form.participantId) {
    errors.participantId = 'Debes seleccionar un participante.';
  }

  if (!form.startDate) {
    errors.startDate = 'La fecha de inicio es obligatoria.';
  }

  if (!form.endDate) {
    errors.endDate = 'La fecha de fin es obligatoria.';
  }

  if (!form.reason.trim()) {
    errors.reason = 'El motivo de la pausa es obligatorio.';
  }

  if (form.startDate && form.endDate) {
    const startDate = parseDateOnly(form.startDate);

    const endDate = parseDateOnly(form.endDate);

    if (startDate !== null && endDate !== null && endDate < startDate) {
      errors.endDate =
        'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }
  }

  return errors;
}

export function hasAdministrativePauseFormErrors(errors) {
  return Object.keys(errors).length > 0;
}
