import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  createAccount,
} from '../../../api/registrationApi.js';

import {
  useRegistration,
} from '../../../hooks/useRegistration.js';

import {
  validateAccountForm,
} from '../../../services/registrationValidation.js';

import {
  clearAccountFieldErrors,
  createAccountFormState,
  focusField,
  focusFirstInvalidField,
  hasValidationErrors,
} from '../utils/accountForm.js';

export function useCreateAccountPage() {
  const navigate = useNavigate();

  const { saveAccount } = useRegistration();

  const [form, setForm] = useState(
    createAccountFormState,
  );

  const [errors, setErrors] = useState({});

  const [submitError, setSubmitError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) =>
      clearAccountFieldErrors(
        currentErrors,
        name,
      ),
    );

    setSubmitError('');
  }

  function showValidationErrors(
    validationErrors,
  ) {
    setErrors(validationErrors);
    focusFirstInvalidField(validationErrors);
  }

  function showDuplicatedEmailError() {
    setErrors((currentErrors) => ({
      ...currentErrors,

      email:
        'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.',
    }));

    focusField('email');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors =
      validateAccountForm(form);

    if (
      hasValidationErrors(validationErrors)
    ) {
      showValidationErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      /*
       * confirmPassword se utiliza únicamente
       * para validación local y no se envía.
       */
      const account = await createAccount({
        email: form.email,
        password: form.password,
      });

      saveAccount(account);

      navigate('/registro/consentimiento', {
        replace: true,
      });
    } catch (error) {
      if (
        error?.code ===
        'EMAIL_ALREADY_EXISTS'
      ) {
        showDuplicatedEmailError();
        return;
      }

      setSubmitError(
        'No pudimos crear tu cuenta. Verifica tu conexión e intenta nuevamente.',
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