import { AlertTriangle, ArrowLeft, Info, Timer } from 'lucide-react';

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
    ? 'border-[var(--danger-border)]'
    : 'border-[var(--surface-border)]';

  const countdownColorClass = isExpired
    ? 'text-[var(--danger-text)]'
    : isCountdownLow
      ? 'text-[var(--warning-text)]'
      : 'text-[var(--brand-500)]';

  return (
    <div className="flex min-h-screen justify-center bg-[var(--surface-bg)] md:items-center md:p-[var(--space-8)]">
      <div className="flex min-h-screen w-full max-w-[480px] flex-col gap-[var(--space-6)] bg-[var(--surface-card)] px-[var(--space-5)] pt-[var(--space-7)] pb-[var(--space-9)] md:min-h-0 md:rounded-[var(--radius-xl)] md:border md:border-[var(--surface-border)] md:p-[var(--space-7)] md:shadow-[var(--shadow-md)]">
        <header className="flex items-center gap-[var(--space-3)]">
          <button
            type="button"
            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border-0 bg-[var(--surface-hover)] p-0 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-border)]"
            onClick={goBack}
            aria-label="Volver"
          >
            <ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <span className="text-[13px] font-bold text-[var(--text-secondary)]">
            Nueva contraseña
          </span>
        </header>

        <section className="flex flex-col">
          <h1 className="m-0 text-[22px] leading-[1.2] font-extrabold text-[var(--text-primary)]">
            Restablece tu contraseña
          </h1>

          <p className="mt-[var(--space-1)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
            Ingresa el código que recibiste en tu correo
          </p>
        </section>

        <div className={`flex items-center justify-between rounded-[var(--radius-md)] border bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)] text-[11.5px] ${timerBorderClass}`}>
          <span className="inline-flex items-center gap-[var(--space-1)] text-[var(--text-muted)]">
            <Timer size={14} strokeWidth={1.8} aria-hidden="true" />
            Código válido por:
          </span>

          <span className={`font-[var(--font-mono)] font-bold ${countdownColorClass}`}>
            {formatRecoveryCountdown(remainingMs)}
          </span>
        </div>

        {isExpired && (
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-4)] text-[var(--warning-text)]" role="alert">
            <Timer size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />

            <div>
              <strong className="block text-[13px]">
                El código ha expirado
              </strong>

              <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">
                Solicita un nuevo código de verificación.
              </p>
            </div>
          </div>
        )}

        {justRequested && (
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)] text-[var(--info-text)]">
            <Info size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />

            <p className="m-0 text-[12px] leading-[1.5]">
              Si el correo está registrado, recibirás un código.
            </p>
          </div>
        )}

        {submitError && (
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]" role="alert">
            <AlertTriangle size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />

            <div>
              <strong className="block text-[13px]">
                No pudimos restablecer tu contraseña
              </strong>

              <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">
                {submitError}
              </p>
            </div>
          </div>
        )}

        <RecoverResetForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          isExpired={isExpired}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}