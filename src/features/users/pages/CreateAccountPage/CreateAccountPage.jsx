import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { BrisaLogo } from '../../../../shared/components/brand/BrisaLogo/index.js';
import { Button } from '../../../../shared/components/ui/Button/index.js';
import { TextField } from '../../../../shared/components/ui/TextField/index.js';

import { createAccount } from '../../api/registrationApi.js';
import { PasswordStrength } from '../../components/PasswordStrength/index.js';
import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';
import { validateAccountForm } from '../../services/registrationValidation.js';
import { useRegistration } from '../../hooks/useRegistration.js';

import styles from './CreateAccountPage.module.css';

const INITIAL_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
};

export function CreateAccountPage() {
  const navigate = useNavigate();

  const { saveAccount } = useRegistration();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

      const updatedErrors = { ...currentErrors };
      delete updatedErrors[name];

      return updatedErrors;
    });

    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateAccountForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      const firstInvalidField = Object.keys(validationErrors)[0];

      requestAnimationFrame(() => {
        document.getElementById(firstInvalidField)?.focus();
      });

      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const account = await createAccount({
        email: form.email,
        password: form.password,
      });

      saveAccount(account);

      navigate('/registro/consentimiento', {
        replace: true,
      });
    } catch (error) {
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors((currentErrors) => ({
          ...currentErrors,
          email: 'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.',
        }));

        requestAnimationFrame(() => {
          document.getElementById('email')?.focus();
        });

        return;
      }

      setSubmitError(
        'No pudimos crear tu cuenta. Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrisaLogo />
      </header>

      <RegistrationStepper currentStep={1} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>Paso 1 de 4</span>

        <h1 className={styles.title}>Crea tu cuenta</h1>

        <p className={styles.description}>
          Usa cualquier correo electrónico para comenzar tu proceso en Brisa.
        </p>
      </section>

      {submitError && (
        <div className={styles.alert} role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>No pudimos crear tu cuenta</strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <TextField
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          error={errors.email}
          onChange={handleChange}
          startIcon={<Mail size={19} strokeWidth={1.5} />}
          required
        />

        <div>
          <TextField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={form.password}
            error={errors.password}
            onChange={handleChange}
            startIcon={<LockKeyhole size={19} strokeWidth={1.5} />}
            endAdornment={
              <button
                type="button"
                className={styles.visibilityButton}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={19} strokeWidth={1.5} />
                ) : (
                  <Eye size={19} strokeWidth={1.5} />
                )}
              </button>
            }
            required
          />

          <PasswordStrength password={form.password} />
        </div>

        <TextField
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmation ? 'text' : 'password'}
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleChange}
          startIcon={<LockKeyhole size={19} strokeWidth={1.5} />}
          endAdornment={
            <button
              type="button"
              className={styles.visibilityButton}
              onClick={() => setShowConfirmation((visible) => !visible)}
              aria-label={
                showConfirmation
                  ? 'Ocultar confirmación de contraseña'
                  : 'Mostrar confirmación de contraseña'
              }
              aria-pressed={showConfirmation}
            >
              {showConfirmation ? (
                <EyeOff size={19} strokeWidth={1.5} />
              ) : (
                <Eye size={19} strokeWidth={1.5} />
              )}
            </button>
          }
          required
        />

        <div className={styles.privacyNotice}>
          <ShieldCheck
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
          />

          <p>
            No solicitaremos tu nombre, documento de identidad ni otros datos
            personales en esta etapa.
          </p>
        </div>

        <Button
          type="submit"
          size="large"
          fullWidth
          loading={isSubmitting}
          loadingText="Creando cuenta..."
        >
          Crear mi cuenta
        </Button>
      </form>
    </div>
  );
}