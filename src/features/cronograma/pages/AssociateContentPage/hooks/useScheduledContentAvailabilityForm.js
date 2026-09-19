import { useState } from 'react';

import {
  hasScheduledContentAvailabilityFormErrors,
  validateScheduledContentAvailabilityForm,
} from '../utils/scheduledContentAvailabilityValidation.js';

const EMPTY_FORM = {
  associationId: '',
  availableFrom: '',
  availableUntil: '',
};

export function useScheduledContentAvailabilityForm({
  onValidSubmit,
} = {}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      const staleKeys = [
        name,
        name === 'availableFrom' ? 'availableUntil' : '',
      ].filter((key) => key && currentErrors[key]);

      if (staleKeys.length === 0) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };

      staleKeys.forEach((key) => delete nextErrors[key]);

      return nextErrors;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors =
      validateScheduledContentAvailabilityForm(form);

    if (
      hasScheduledContentAvailabilityFormErrors(validationErrors)
    ) {
      setErrors(validationErrors);
      return;
    }

    if (!form.associationId) {
      return;
    }

    setErrors({});

    onValidSubmit?.({
      associationId: form.associationId,
      availableFrom: form.availableFrom,
      availableUntil: form.availableUntil,
    });
  }

  function loadAvailability({
    associationId = '',
    availableFrom = '',
    availableUntil = '',
  } = {}) {
    setForm({
      associationId,
      availableFrom,
      availableUntil,
    });

    setErrors({});
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setErrors({});
  }

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
    loadAvailability,
    resetForm,
  };
}
