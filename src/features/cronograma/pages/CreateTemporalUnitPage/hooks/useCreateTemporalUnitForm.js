import { useState } from 'react';

import {
  hasTemporalUnitFormErrors,
  validateTemporalUnitForm,
} from '../utils/temporalUnitFormValidation.js';

const INITIAL_FORM = Object.freeze({
  name: '',
  order: '',
  startDate: '',
  endDate: '',
});

export function useCreateTemporalUnitForm({ onValidSubmit } = {}) {
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

    const validationErrors = validateTemporalUnitForm(form);

    if (hasTemporalUnitFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      name: form.name.trim(),
      order: Number(form.order),
      startDate: form.startDate,
      endDate: form.endDate,
    });
  }

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
  };
}
