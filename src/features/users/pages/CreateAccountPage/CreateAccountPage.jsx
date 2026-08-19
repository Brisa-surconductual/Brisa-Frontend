import { AlertTriangle } from 'lucide-react';

import {
  BrisaLogo,
} from '../../../../shared/components/brand/BrisaLogo/index.js';

import {
  RegistrationStepper,
} from '../../components/RegistrationStepper/index.js';

import {
  CreateAccountForm,
} from './components/CreateAccountForm.jsx';

import {
  useCreateAccountPage,
} from './hooks/useCreateAccountPage.js';

export function CreateAccountPage() {
  const {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useCreateAccountPage();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-6)]">
      <header className="flex justify-center pb-[var(--space-2)]">
        <BrisaLogo />
      </header>

      <RegistrationStepper currentStep={1} />

      <section className="flex flex-col">
        <span className="mb-[var(--space-2)] font-[var(--font-mono)] text-[10px] font-medium tracking-[0.08em] text-[var(--brand-600)] uppercase">
          Paso 1 de 4
        </span>

        <h1 className="m-0 text-[28px] leading-[1.2] font-extrabold tracking-[-0.025em] text-[var(--text-primary)] max-[370px]:text-[24px]">
          Crea tu cuenta
        </h1>

        <p className="mt-[var(--space-2)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          Usa cualquier correo electrónico para comenzar tu proceso en Brisa.
        </p>
      </section>

      {submitError && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]" role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            className="mt-px shrink-0"
            aria-hidden="true"
          />

          <div>
            <strong className="block text-[13px]">
              No pudimos crear tu cuenta
            </strong>

            <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">
              {submitError}
            </p>
          </div>
        </div>
      )}

      <CreateAccountForm
        form={form}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}