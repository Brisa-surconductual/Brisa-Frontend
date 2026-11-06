import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '@/app/providers/index.js';

import {
  BrisaLogo,
} from '../../../../shared/components/brand/BrisaLogo/index.js';

import {
  Button,
} from '../../../../shared/components/ui/Button/index.js';

import {
  useRegistration,
} from '../../hooks/useRegistration.js';

import {
  REGISTRATION_STATUS,
} from '../../types/registrationStatus.js';

export function RegistrationCompletedPage() {
  const navigate = useNavigate();

  const { account } = useRegistration();

  /*
   * La cuenta puede existir sin una sesión establecida (falló la
   * consulta de la sesión tras crearla): se pide iniciar sesión
   * en lugar de presentarla como autenticada.
   */
  const { isAuthenticated } = useAuth();

  const registrationIsComplete =
    account?.registrationStatus ===
    REGISTRATION_STATUS.COMPLETED;

  if (!registrationIsComplete) {
    return (
      <Navigate
        to="/registro/cuenta"
        replace
      />
    );
  }

  function continueToApp() {
    navigate(isAuthenticated ? '/app' : '/login', {
      replace: true,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-[var(--space-6)] text-center">
      <BrisaLogo />

      <div className="flex flex-col items-center gap-[var(--space-4)]">
        <span className="inline-flex h-[88px] w-[88px] items-center justify-center rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)] shadow-[var(--shadow-sm)]" aria-hidden="true">
          <CheckCircle2
            size={46}
            strokeWidth={1.6}
          />
        </span>

        <span className="rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[var(--space-3)] py-[var(--space-1)] font-[var(--font-mono)] text-[length:var(--font-size-xs)] font-semibold text-[var(--success-text)]">
          Registro completo
        </span>
      </div>

      <section className="flex flex-col gap-[var(--space-3)]">
        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Registro completado
        </h1>

        <p className="m-0 text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Tu cuenta y la información de línea base fueron confirmadas correctamente.
        </p>
      </section>

      <div className="flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-4)] py-[var(--space-3)] text-left text-[var(--info-text)]">
        <ShieldCheck
          size={20}
          strokeWidth={1.6}
          className="mt-[1px] shrink-0"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <span className="block text-[length:var(--font-size-xs)]">
            Cuenta registrada
          </span>

          <strong className="mt-[2px] block [overflow-wrap:anywhere] text-[length:var(--font-size-sm)]">
            {account.email}
          </strong>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-4)] py-[var(--space-3)] text-left text-[var(--warning-text)]" role="status">
          <AlertTriangle
            size={20}
            strokeWidth={1.6}
            className="mt-[1px] shrink-0"
            aria-hidden="true"
          />

          <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
            Tu cuenta fue creada, pero no pudimos iniciar tu sesión
            automáticamente. Inicia sesión con tu correo y contraseña para
            continuar.
          </p>
        </div>
      )}

      <Button
        type="button"
        size="large"
        fullWidth
        onClick={continueToApp}
      >
        {isAuthenticated ? 'Continuar' : 'Iniciar sesión'}
        <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
      </Button>

      <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
        Tu información quedó registrada de acuerdo con las autorizaciones aceptadas.
      </p>
    </div>
  );
}
