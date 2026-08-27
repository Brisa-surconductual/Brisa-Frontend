import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { solicitarRecuperacionContrasena } from '@/features/users/api/recuperacionContrasena.jsx';
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
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => clearFieldErrors(currentErrors, name));
    setSubmitError('');
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
      await solicitarRecuperacionContrasena({
        email: form.email,
      });

      navigate('/recuperar/nueva', {
        state: { requestedEmail: form.email },
      });
    } catch (error) {
      if (error?.response?.status === 429) {
        setSubmitError(
          'Has realizado demasiadas solicitudes. Intenta nuevamente más tarde.',
        );
        return;
      }

      setSubmitError(
        'No pudimos procesar la solicitud en este momento. Intenta nuevamente.',
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