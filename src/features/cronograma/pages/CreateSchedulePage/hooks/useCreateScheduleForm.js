import { useState } from 'react';

const INITIAL_FORM = Object.freeze({
  name: '',
  activationDate: '',
  isBase: false,
});

function validateScheduleForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Ingresa el nombre del cronograma.';
  }

  if (!form.activationDate) {
    errors.activationDate = 'Selecciona la fecha de activación.';
  }

  return errors;
}

export function useCreateScheduleForm({ onValidSubmit } = {}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, type, value, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
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

    const validationErrors = validateScheduleForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    onValidSubmit?.({
      name: form.name.trim(),
      activationDate: form.activationDate,
      isBase: form.isBase,
    });
  }

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
  };
}