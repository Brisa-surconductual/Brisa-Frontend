import { useState } from 'react';

import {
  hasTemporalUnitFormErrors,
  validateTemporalUnitForm,
} from '@/features/cronograma/utils/temporalUnitFormValidation.js';

function createInitialForm(unit) {
  return {
    name: unit?.name ?? '',
    order:
      unit?.order !== undefined && unit?.order !== null
        ? String(unit.order)
        : '',
    startDate: unit?.startDate ?? '',
    endDate: unit?.endDate ?? '',
  };
}

export function useEditTemporalUnitForm({ unit, onValidSubmit }) {
  const [form, setForm] = useState(() => createInitialForm(unit));

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
      id: unit?.id,
      name: form.name.trim(),
      order: Number(form.order),
      startDate: form.startDate,
      endDate: form.endDate,
    });
  }

  function resetForm() {
    setForm(createInitialForm(unit));
    setErrors({});
  }

  return {
    form,
    errors,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
