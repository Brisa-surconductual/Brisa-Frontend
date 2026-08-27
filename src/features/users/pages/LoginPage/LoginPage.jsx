import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react';

import { LoginForm } from './components/LoginForm.jsx';
import { useLoginPage } from './hooks/useLoginPage.js';
import { useLocation } from 'react-router-dom';

export function LoginPage() {
  const location = useLocation();
  const {
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
  } = useLoginPage();
  const passwordReset = Boolean(location.state?.passwordReset);

  return (
    <div className="flex min-h-screen justify-center bg-[var(--surface-bg)] md:items-center md:p-[var(--space-8)]"
    >
      <div className="flex min-h-screen w-full max-w-[480px] flex-col gap-[var(--space-6)] bg-[var(--surface-card)] px-[var(--space-5)] pt-[var(--space-7)] pb-[var(--space-9)] md:min-h-0 md:rounded-[var(--radius-xl)] md:border md:border-[var(--surface-border)] md:p-[var(--space-7)] md:shadow-[var(--shadow-md)] "
      >
        <header
          className=" flex items-center gap-[var(--space-3)] "
        >
          <button type="button" className=" inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border-0 bg-[var(--surface-hover)] p-0 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-border)] " onClick={goBack} aria-label="Volver"
          >
            <ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true"
            />
          </button>

          <span className="text-[13px] font-bold text-[var(--text-secondary)]"
          >
            Iniciar sesión
          </span>
        </header>

        <section className="flex flex-col">
          <h1 className="m-0 text-[22px] leading-[1.2] font-extrabold text-[var(--text-primary)]"
          >
            Bienvenido de nuevo
          </h1>

          <p className="mt-[var(--space-1)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]"
          >
            Ingresa con tu correo electrónico
          </p>
        </section>
        {passwordReset && (
          <div
            className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)] text-[var(--info-text)]"
            role="status"
          >
            <CheckCircle2
              size={20}
              strokeWidth={1.8}
              className="mt-px shrink-0"
              aria-hidden="true"
            />

            <div>
              <strong className="block text-[13px]">
                Contraseña actualizada
              </strong>

              <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">
                Tu contraseña se restableció correctamente. Ya puedes iniciar
                sesión.
              </p>
            </div>
          </div>
        )}

        {wasClosedByInactivity && (
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-4)] text-[var(--warning-text)]" role="status"
          >
            <Clock size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true"
            />

            <div>
              <strong className=" block text-[13px] "
              >
                Cerramos tu sesión por inactividad
              </strong>

              <p className=" mt-[3px] mb-0 text-[12px] leading-[1.5] "
              >
                Ingresa de nuevo para continuar donde ibas.
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <div className=" flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)] " role="alert"
          >
            <AlertTriangle size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true"
            />

            <div>
              <strong className="block text-[13px] "
              >
                No pudimos iniciar sesión
              </strong>

              <p className=" mt-[3px] mb-0 text-[12px] leading-[1.5] "
              >
                {submitError}
              </p>
            </div>
          </div>
        )}

        <LoginForm form={form} errors={errors} isSubmitting={isSubmitting} onChange={handleChange} onSubmit={handleSubmit} onForgotPassword={goToRecover}
        />

        <p className="m-0 text-center text-[13px] text-[var(--text-secondary)] "
        >
          ¿No tienes cuenta?{' '}
          <button type="button" className=" border-0 bg-transparent p-0 font-semibold text-[var(--brand-600)] hover:underline " onClick={goToCreateAccount}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
}