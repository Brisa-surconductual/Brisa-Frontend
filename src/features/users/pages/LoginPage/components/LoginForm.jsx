import { useState } from 'react';

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function LoginForm({
  form,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onForgotPassword,
}) {
  const [
    isPasswordVisible,
    setIsPasswordVisible,
  ] = useState(false);

  const visibilityLabel =
    isPasswordVisible
      ? 'Ocultar contraseña'
      : 'Mostrar contraseña';

  function toggleVisibility() {
    setIsPasswordVisible(
      (currentValue) => !currentValue,
    );
  }

  return (
    <form className="flex flex-col gap-[var(--space-5)]"
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
          <Mail size={19} strokeWidth={1.5} aria-hidden="true"
          />
        }
        required
      />

      <TextField
        id="password"
        name="password"
        type={
          isPasswordVisible
            ? 'text'
            : 'password'
        }
        label="Contraseña"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        value={form.password}
        error={errors.password}
        onChange={onChange}
        disabled={isSubmitting}
        startIcon={
          <LockKeyhole size={19} strokeWidth={1.5} aria-hidden="true"
          />
        }
        endAdornment={
          <button type="button" className="inline-flex h-[36px] w-[36px] items-center justify-center rounded-[var(--radius-md)] border-0 bg-transparent p-0 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none" onClick={toggleVisibility} aria-label={visibilityLabel} aria-pressed={isPasswordVisible} disabled={isSubmitting}
          >
            {isPasswordVisible ? (
              <EyeOff size={19} strokeWidth={1.5} aria-hidden="true"
              />
            ) : (
              <Eye size={19} strokeWidth={1.5} aria-hidden="true"
              />
            )}
          </button>
        }
        required
      />

      <button type="button" className="-mt-[var(--space-2)] inline-flex min-h-[44px] items-center self-end rounded-[var(--radius-sm)] border-0 bg-transparent px-[var(--space-1)] text-[length:var(--font-size-sm)] font-semibold text-[var(--brand-600)] underline-offset-4 hover:underline" onClick={onForgotPassword}
      >
        ¿Olvidaste tu contraseña?
      </button>

      <Button type="submit" size="large" fullWidth loading={isSubmitting} loadingText="Iniciando sesión..."
      >
        Iniciar sesión
      </Button>
    </form>
  );
}