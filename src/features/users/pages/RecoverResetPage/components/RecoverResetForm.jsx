import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { PasswordField } from './PasswordField.jsx';

import styles from './RecoverResetForm.module.css';

export function RecoverResetForm({
  form,
  errors,
  isSubmitting,
  isExpired = false,
  onChange,
  onSubmit,
}) {
  const fieldsDisabled = isSubmitting || isExpired;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <TextField
        id="code"
        name="code"
        type="text"
        label="Código de verificación"
        placeholder="123456"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={form.code}
        error={errors.code}
        onChange={onChange}
        disabled={fieldsDisabled}
        required
      />

      <PasswordField
        id="password"
        name="password"
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        value={form.password}
        error={errors.password}
        onChange={onChange}
        disabled={fieldsDisabled}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar nueva contraseña"
        placeholder="Repite la contraseña"
        value={form.confirmPassword}
        error={errors.confirmPassword}
        onChange={onChange}
        disabled={fieldsDisabled}
      />

      <Button
        type="submit"
        size="large"
        fullWidth
        disabled={isExpired}
        loading={isSubmitting}
        loadingText="Restableciendo..."
      >
        Restablecer contraseña
      </Button>
    </form>
  );
}
