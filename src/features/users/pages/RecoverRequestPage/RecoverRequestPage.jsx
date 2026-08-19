import {
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

import { RecoverRequestForm } from './components/RecoverRequestForm.jsx';
import { useRecoverRequestPage } from './hooks/useRecoverRequestPage.js';

export function RecoverRequestPage() {
  const {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
    goBack,
  } = useRecoverRequestPage();

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
            Recuperar contraseña
          </span>
        </header>

        <section>
          <h1 className="m-0 text-[22px] leading-[1.2] font-extrabold text-[var(--text-primary)]">
            Recupera tu acceso
          </h1>

          <p className="mt-[var(--space-1)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
            Ingresa tu correo y te enviaremos un código de verificación
          </p>
        </section>

        {submitError && (
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]" role="alert">
            <AlertTriangle size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />

            <div>
              <strong className="block text-[13px]">
                No pudimos procesar la solicitud
              </strong>

              <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">
                {submitError}
              </p>
            </div>
          </div>
        )}

        <RecoverRequestForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <p className="m-0 text-center text-[12px] leading-[1.5] text-[var(--text-muted)]">
          Por seguridad, no confirmamos si el correo existe en el sistema.
        </p>
      </div>
    </div>
  );
}