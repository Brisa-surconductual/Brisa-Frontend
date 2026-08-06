import { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { resetPassword } from '@/features/users/api/authApi.js';
import { AUTH_API_ERROR } from '@/features/users/types/authTypes.js';
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

  /*
   * Solo se usa para mostrar el aviso neutro una vez, al
   * llegar desde el paso 1. No se depende de esto para
   * ninguna llamada a la API (resetPassword no requiere
   * el correo).
   */
  const justRequested = Boolean(location.state?.requestedEmail);

  const [form, setForm] = useState(createRecoverResetFormState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * El código se considera generado al montar esta
   * página (llegue desde el paso 1 o directo por enlace),
   * con la misma vigencia de 2 minutos del prototipo.
   */
  const [expiresAt] = useState(() => Date.now() + RECOVERY_CODE_TTL_MS);
  const [remainingMs, setRemainingMs] = useState(() => expiresAt - Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingMs(Math.max(0, expiresAt - Date.now()));
    }, COUNTDOWN_TICK_MS);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  const isExpired = remainingMs <= 0;
  const isCountdownLow = remainingMs <= RECOVERY_CODE_WARNING_THRESHOLD_MS;

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
      await resetPassword({
        code: form.code,
        password: form.password,
      });

      navigate('/login', { replace: true });
    } catch (error) {
      if (error?.code === AUTH_API_ERROR.INVALID_RECOVERY_CODE) {
        setSubmitError(
          'El código de recuperación no es válido. Verifica e intenta de nuevo.',
        );
        return;
      }

      setSubmitError(
        'No pudimos restablecer tu contraseña. Verifica tu conexión e intenta nuevamente.',
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
