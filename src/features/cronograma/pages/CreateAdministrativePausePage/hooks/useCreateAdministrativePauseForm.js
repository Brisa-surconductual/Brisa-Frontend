import { useState } from 'react';

import {
  hasAdministrativePauseFormErrors,
  validateAdministrativePauseForm,
} from '../utils/administrativePauseFormValidation.js';

const INITIAL_FORM = Object.freeze({
  participantId: '',
  startDate: '',
  endDate: '',
  reason: '',
});

export function useCreateAdministrativePauseForm({ onValidSubmit } = {}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[name];

      return nextErrors;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateAdministrativePauseForm(form);

    if (hasAdministrativePauseFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      participantId: form.participantId,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim(),
    });
  }

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
  };
}
