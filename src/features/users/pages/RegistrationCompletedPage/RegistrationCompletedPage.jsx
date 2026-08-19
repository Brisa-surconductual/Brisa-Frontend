import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

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
    navigate('/app', {
      replace: true,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-[var(--space-6)] text-center">
      <BrisaLogo />

      <span className="inline-flex h-[82px] w-[82px] items-center justify-center rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]" aria-hidden="true">
        <CheckCircle2
          size={44}
          strokeWidth={1.6}
        />
      </span>

      <section>
        <h1 className="m-0 text-[28px] font-extrabold text-[var(--text-primary)]">
          Registro completado
        </h1>

        <p className="mt-[var(--space-3)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          Tu cuenta y la información de línea base fueron confirmadas correctamente.
        </p>
      </section>

      <div className="flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)] text-left text-[var(--info-text)]">
        <ShieldCheck
          size={20}
          strokeWidth={1.6}
          className="shrink-0"
          aria-hidden="true"
        />

        <div>
          <span className="block text-[11px]">
            Cuenta registrada
          </span>

          <strong className="mt-[2px] block [overflow-wrap:anywhere] text-[13px]">
            {account.email}
          </strong>
        </div>
      </div>

      <span className="rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[12px] py-[4px] font-[var(--font-mono)] text-[10px] font-medium text-[var(--success-text)]">
        Registro completo
      </span>

      <Button
        type="button"
        size="large"
        fullWidth
        onClick={continueToApp}
      >
        Continuar
      </Button>

      <p className="m-0 text-[11px] text-[var(--text-muted)]">
        Tu información quedó registrada de acuerdo con las autorizaciones aceptadas.
      </p>
    </div>
  );
}