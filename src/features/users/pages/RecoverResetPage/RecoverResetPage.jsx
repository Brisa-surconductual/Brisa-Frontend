import { AlertTriangle, Info, Timer } from 'lucide-react';

import { AuthCardShell } from '../../components/AuthCardShell/index.js';
import { FormNotice } from '../../components/FormNotice/index.js';
import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';

import { RecoverResetForm } from './components/RecoverResetForm.jsx';
import { useRecoverResetPage } from './hooks/useRecoverResetPage.js';
import { formatRecoveryCountdown } from './utils/recoverResetForm.js';

export function RecoverResetPage() {
  const {
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
  } = useRecoverResetPage();

  const timerBorderClass = isExpired
    ? 'border-[var(--danger-border)] bg-[var(--danger-bg)]'
    : isCountdownLow
      ? 'border-[var(--warning-border)] bg-[var(--warning-bg)]'
      : 'border-[var(--surface-border)] bg-[var(--surface-hover)]';

  const countdownColorClass = isExpired
    ? 'text-[var(--danger-text)]'
    : isCountdownLow
      ? 'text-[var(--warning-text)]'
      : 'text-[var(--brand-600)]';

  return (
    <AuthCardShell>
      <RegistrationHeader
        onBack={goBack}
        eyebrow="Nueva contraseña"
        title="Restablece tu contraseña"
        description="Ingresa el código que recibiste en tu correo"
      />

      <div className={`flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] ${timerBorderClass}`}>
        <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-secondary)]">
          <Timer size={16} strokeWidth={1.8} aria-hidden="true" />
          Código válido por:
        </span>

        <span className={`font-[var(--font-mono)] text-[length:var(--font-size-base)] font-bold tabular-nums ${countdownColorClass}`}>
          {formatRecoveryCountdown(remainingMs)}
        </span>
      </div>

      {isExpired && (
        <FormNotice
          tone="warning"
          icon={Timer}
          title="El código ha expirado"
          role="alert"
        >
          Solicita un nuevo código de verificación.
        </FormNotice>
      )}

      {justRequested && (
        <FormNotice tone="info" icon={Info}>
          Si el correo está registrado, recibirás un código.
        </FormNotice>
      )}

      {submitError && (
        <FormNotice
          tone="danger"
          icon={AlertTriangle}
          title="No pudimos restablecer tu contraseña"
          role="alert"
        >
          {submitError}
        </FormNotice>
      )}

      <RecoverResetForm
        form={form}
        errors={errors}
        isSubmitting={isSubmitting}
        isExpired={isExpired}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </AuthCardShell>
  );
}
