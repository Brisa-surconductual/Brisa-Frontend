import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { actualizarContrasena } from '@/features/users/api/recuperacionContrasena.jsx';
import { validateRecoverResetForm } from '@/features/users/services/authValidation.js';

import {
  clearFieldErrors,
  createRecoverResetFormState,
  focusFirstInvalidField,
  hasValidationErrors,
  RECOVERY_CODE_TTL_MS,
  RECOVERY_CODE_WARNING_THRESHOLD_MS,
} from '../utils/recoverResetForm.js';

const COUNTDOWN_TICK_MS = 500;

export function useRecoverResetPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const justRequested = Boolean(location.state?.requestedEmail);

  const [form, setForm] = useState(createRecoverResetFormState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expiresAt] = useState(() => Date.now() + RECOVERY_CODE_TTL_MS);
  const [remainingMs, setRemainingMs] = useState(() => expiresAt - Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingMs(Math.max(0, expiresAt - Date.now()));
    }, COUNTDOWN_TICK_MS);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  const isExpired = remainingMs <= 0;
  const isCountdownLow =
    remainingMs <= RECOVERY_CODE_WARNING_THRESHOLD_MS;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) =>
      clearFieldErrors(currentErrors, name),
    );

    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || isExpired) {
      return;
    }

    const validationErrors = validateRecoverResetForm(form);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      focusFirstInvalidField(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await actualizarContrasena({
        code: form.code,
        password: form.password,
      });

      navigate('/login', {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (error) {
      const status = error?.response?.status;

      if (status === 400) {
        setSubmitError(
          'El código de recuperación no es válido o ha expirado. Verifica el código e intenta nuevamente.',
        );
        return;
      }

      if (status === 429) {
        setSubmitError(
          'Has realizado demasiados intentos. Intenta nuevamente más tarde.',
        );
        return;
      }

      setSubmitError(
        'No pudimos restablecer tu contraseña en este momento. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    navigate('/recuperar');
  }

  return {
    justRequested,
    form,
    errors,
    submitError,
    isSubmitting,
    remainingMs,
    isExpired,
    isCountdownLow,
    handleChange,
    handleSubmit,
    goBack,
  };
}
