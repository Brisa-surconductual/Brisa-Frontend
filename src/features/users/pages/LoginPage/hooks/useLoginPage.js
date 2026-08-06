import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SESSION_END_REASON } from '@/app/config/sessionConfig.js';
import { useAuth } from '@/app/providers/index.js';

import { login as loginRequest } from '@/features/users/api/authApi.js';
import { AUTH_API_ERROR } from '@/features/users/types/authTypes.js';
import { validateLoginForm } from '@/features/users/services/authValidation.js';

import {
  clearFieldErrors,
  createLoginFormState,
  focusFirstInvalidField,
  hasValidationErrors,
} from '../utils/loginForm.js';

export function useLoginPage() {
  const navigate = useNavigate();
  const { login, sessionEndReason } = useAuth();

  /*
   * El motivo del cierre viaja en la sesión, no en el
   * state de la navegación: así no depende de qué
   * redirección llegue primero a /login.
   */
  const wasClosedByInactivity =
    sessionEndReason === SESSION_END_REASON.INACTIVITY;

  const [form, setForm] = useState(createLoginFormState);
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

    const validationErrors = validateLoginForm(form);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      focusFirstInvalidField(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const session = await loginRequest({
        email: form.email,
        password: form.password,
      });

      // Registra la sesión global antes de entrar a la app.
      login(session);

      navigate('/app', { replace: true });
    } catch (error) {
      if (error?.code === AUTH_API_ERROR.INVALID_CREDENTIALS) {
        setSubmitError(
          'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.',
        );
        return;
      }

      setSubmitError(
        'No pudimos iniciar sesión. Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    navigate('/');
  }

  function goToRecover() {
    navigate('/recuperar');
  }

  function goToCreateAccount() {
    navigate('/registro/cuenta');
  }

  return {
    form,
    errors,
    wasClosedByInactivity,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
    goBack,
    goToRecover,
    goToCreateAccount,
  };
}
