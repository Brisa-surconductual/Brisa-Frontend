import { useState } from 'react';

import {
  hasPsychoeducationalContentFormErrors,
  validatePsychoeducationalContentForm,
} from '@/features/cronograma/utils/psychoeducationalContentFormValidation.js';

const EMPTY_FORM = Object.freeze({
  name: '',
  type: '',
});

export function usePsychoeducationalContentForm({
  initialValues = EMPTY_FORM,
  onValidSubmit,
} = {}) {
  const [form, setForm] = useState({
    name: initialValues.name ?? '',
    type: initialValues.type ?? '',
  });

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

    const validationErrors =
      validatePsychoeducationalContentForm(form);

    if (
      hasPsychoeducationalContentFormErrors(
        validationErrors,
      )
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      name: form.name.trim(),
      type: form.type,
    });
  }

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
  };
}
