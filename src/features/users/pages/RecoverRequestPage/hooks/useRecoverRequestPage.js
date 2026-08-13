import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { requestPasswordRecovery } from '@/features/users/api/authApi.js';
import { validateRecoverRequestForm } from '@/features/users/services/authValidation.js';

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
  const [submitError, setSubmitError] =
  useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setSubmitError('');

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
    setSubmitError('');

    try {
      await requestPasswordRecovery({
        email: form.email,
      });

      navigate('/recuperar/nueva', {
        state: {
          requestedEmail:
            form.email.trim().toLowerCase(),
        },
      });
    } catch {
      setSubmitError(
        'No pudimos procesar la solicitud. Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    navigate('/login');
  }

  return {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
    goBack,
  };
}
