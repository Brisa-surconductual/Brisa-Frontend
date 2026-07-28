import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { requestPasswordRecovery } from '@/features/auth/api/authApi.js';
import { validateRecoverRequestForm } from '@/features/auth/services/authValidation.js';

import {
  clearFieldErrors,
  createRecoverRequestFormState,
  focusFirstInvalidField,
  hasValidationErrors,
} from '../utils/recoverRequestForm.js';

export function useRecoverRequestPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(createRecoverRequestFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => clearFieldErrors(currentErrors, name));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateRecoverRequestForm(form);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      focusFirstInvalidField(validationErrors);
      return;
    }

    setIsSubmitting(true);

    /*
     * requestPasswordRecovery siempre resuelve (respuesta
     * neutra por seguridad, ver authApi.js): no hay código
     * de error que manejar acá.
     */
    await requestPasswordRecovery({ email: form.email });

    navigate('/recuperar/nueva', {
      state: { requestedEmail: form.email },
    });
  }

  function goBack() {
    navigate('/login');
  }

  return {
    form,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    goBack,
  };
}
