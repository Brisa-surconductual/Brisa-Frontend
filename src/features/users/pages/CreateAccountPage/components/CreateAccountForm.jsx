import {
  Mail,
  ShieldCheck,
} from 'lucide-react';

import {
  Button,
} from '../../../../../shared/components/ui/Button/index.js';

import {
  TextField,
} from '../../../../../shared/components/ui/TextField/index.js';

import {
  PasswordField,
} from './PasswordField.jsx';

import styles from './CreateAccountForm.module.css';

export function CreateAccountForm({
  form,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <form
      className={styles.form}
      onSubmit={onSubmit}
      noValidate
    >
      <TextField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="email"
        value={form.email}
        error={errors.email}
        onChange={onChange}
        disabled={isSubmitting}
        startIcon={
          <Mail
            size={19}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        }
        required
      />

      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        value={form.password}
        error={errors.password}
        onChange={onChange}
        showStrength
        disabled={isSubmitting}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        value={form.confirmPassword}
        error={errors.confirmPassword}
        onChange={onChange}
        disabled={isSubmitting}
      />

      <div className={styles.privacyNotice}>
        <ShieldCheck
          size={20}
          strokeWidth={1.5}
          aria-hidden="true"
        />

        <p>
          No solicitaremos tu nombre, documento de
          identidad ni otros datos personales en esta
          etapa.
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
  );
}