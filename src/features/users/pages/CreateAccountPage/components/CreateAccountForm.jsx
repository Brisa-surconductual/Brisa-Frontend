import { Link } from 'react-router-dom';

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


export function CreateAccountForm({
  form,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <form className="flex flex-col gap-[var(--space-5)]" onSubmit={onSubmit} noValidate>
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

      <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-4)] text-[var(--text-secondary)]">
        <ShieldCheck
          size={20}
          strokeWidth={1.5}
          className="shrink-0 text-[var(--brand-600)]"
          aria-hidden="true"
        />

        <p className="m-0 text-[12px] leading-[1.55]">
          No solicitaremos tu nombre, documento de identidad ni otros datos personales en esta etapa.
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

      <div className="mt-[var(--space-1)] flex flex-wrap items-center justify-center gap-[var(--space-2)] text-center text-[14px] text-[var(--text-secondary)]">
        <span>¿Ya tienes una cuenta?</span>

        <Link
          to="/login"
          className="rounded-[var(--radius-sm)] font-semibold text-[var(--brand-600)] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--brand-500)]"
        >
          Iniciar sesión
        </Link>
      </div>
    </form>
  );
}