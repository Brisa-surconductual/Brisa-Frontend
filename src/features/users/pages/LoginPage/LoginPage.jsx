import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { BrisaLogo } from '@/shared/components/brand/BrisaLogo/index.js';

import { LoginBrandPanel } from './components/LoginBrandPanel.jsx';
import { LoginForm } from './components/LoginForm.jsx';
import { LoginNotice } from './components/LoginNotice.jsx';
import { useLoginPage } from './hooks/useLoginPage.js';

export function LoginPage() {
  const location = useLocation();
  const {
    form,
    errors,
    wasClosedByInactivity,
    remoteLogoutUnconfirmed,
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
    <div className="min-h-screen bg-[var(--surface-card)] md:bg-[var(--surface-bg)] lg:flex lg:items-center lg:justify-center lg:p-[var(--space-8)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[var(--container-auth)] lg:min-h-[640px] lg:grid-cols-2 lg:overflow-hidden lg:rounded-[var(--radius-3xl)] lg:border lg:border-[var(--surface-border)] lg:bg-[var(--surface-card)] lg:shadow-[var(--shadow-xl)]">
        <LoginBrandPanel />

        <main className="flex flex-col px-[var(--space-5)] pt-[var(--space-6)] pb-[var(--space-9)] md:items-center md:justify-center md:p-[var(--space-8)] lg:p-[var(--space-10)]">
          <div className="flex w-full max-w-[var(--container-form)] flex-col gap-[var(--space-6)] md:rounded-[var(--radius-2xl)] md:border md:border-[var(--surface-border)] md:bg-[var(--surface-card)] md:p-[var(--space-8)] md:shadow-[var(--shadow-md)] lg:rounded-none lg:border-0 lg:p-0 lg:shadow-none">
            <header className="flex items-center justify-between gap-[var(--space-3)]">
              <button
                type="button"
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-0 text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
                onClick={goBack}
                aria-label="Volver"
              >
                <ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" />
              </button>

              {/* En escritorio la marca vive en el panel lateral. */}
              <div className="lg:hidden">
                <BrisaLogo />
              </div>
            </header>

            <section className="flex flex-col gap-[var(--space-2)]">
              <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
                Iniciar sesión
              </p>

              <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
                Te damos la bienvenida
              </h1>

              <p className="m-0 text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)] md:text-[length:var(--font-size-base)]">
                Ingresa con tu correo electrónico y tu contraseña.
              </p>
            </section>

            {passwordReset && (
              <LoginNotice
                tone="success"
                icon={CheckCircle2}
                title="Contraseña actualizada"
                role="status"
              >
                Tu contraseña se restableció correctamente. Ya puedes iniciar
                sesión.
              </LoginNotice>
            )}

            {wasClosedByInactivity && (
              <LoginNotice
                tone="warning"
                icon={Clock}
                title="Cerramos tu sesión por inactividad"
                role="status"
              >
                Ingresa de nuevo para continuar donde ibas.
              </LoginNotice>
            )}

            {remoteLogoutUnconfirmed && (
              <LoginNotice
                tone="warning"
                icon={AlertTriangle}
                title="No pudimos confirmar el cierre de sesión"
                role="alert"
              >
                El servidor no confirmó el cierre. Lo intentaremos de nuevo la
                próxima vez que abras Brisa en este dispositivo. Si usas un
                equipo compartido, vuelve a abrir Brisa cuando tengas conexión
                para completarlo.
              </LoginNotice>
            )}

            {submitError && (
              <LoginNotice
                tone="danger"
                icon={AlertTriangle}
                title="No pudimos iniciar sesión"
                role="alert"
              >
                {submitError}
              </LoginNotice>
            )}

            <LoginForm
              form={form}
              errors={errors}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onForgotPassword={goToRecover}
            />

            <p className="m-0 flex flex-wrap items-center justify-center gap-x-[var(--space-1)] border-t border-[var(--surface-border)] pt-[var(--space-5)] text-center text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              ¿No tienes cuenta?
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] border-0 bg-transparent px-[var(--space-1)] font-bold text-[var(--brand-600)] underline-offset-4 hover:underline"
                onClick={goToCreateAccount}
              >
                Crear cuenta
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
