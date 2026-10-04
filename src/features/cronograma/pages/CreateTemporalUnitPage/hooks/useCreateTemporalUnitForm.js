import { useState } from 'react';

import { crearUnidadTemporal } from '@/features/cronograma/api/unidadTemporal/crearUnidadTemporal.jsx';
import {
  hasTemporalUnitFormErrors,
  validateTemporalUnitForm,
} from '@/features/cronograma/utils/temporalUnitFormValidation.js';

const INITIAL_FORM = Object.freeze({
  idSchedule: '',
  name: '',
  startDate: '',
  endDate: '',
});

export function useCreateTemporalUnitForm({ onValidSubmit } = {}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];

      return nextErrors;
    });

    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateTemporalUnitForm(form);

    if (hasTemporalUnitFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      idSchedule: form.idSchedule,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const createdTemporalUnit = await crearUnidadTemporal(payload);

      onValidSubmit?.(createdTemporalUnit);
    } catch (error) {
      setSubmitError(
        'No fue posible crear la unidad temporal. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
}