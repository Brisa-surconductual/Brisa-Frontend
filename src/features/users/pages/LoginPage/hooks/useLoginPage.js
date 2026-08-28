import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SESSION_END_REASON } from '@/app/config/sessionConfig.js';
import { useAuth } from '@/app/providers/index.js';
import { validateLoginForm } from '@/features/users/services/authValidation.js';
import { iniciarSesion } from '../../../api/inicioSesion.jsx';
import { clearFieldErrors, createLoginFormState, focusFirstInvalidField, hasValidationErrors } from '../utils/loginForm.js';

export function useLoginPage() {
  const navigate = useNavigate();
  const { login, sessionEndReason } = useAuth();

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
      const data = await iniciarSesion({
        email: form.email,
        password: form.password,
      });

      login({
        email: form.email,
        role: data.rol,
      });

      navigate('/app', { replace: true });
    } catch (error) {
      if (error?.response?.status === 401) {
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