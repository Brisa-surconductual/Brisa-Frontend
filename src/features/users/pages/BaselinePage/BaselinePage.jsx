import { Navigate } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';

import { BaselineAcademicSection } from './components/BaselineAcademicSection.jsx';
import { BaselineConsumptionSection } from './components/BaselineConsumptionSection.jsx';
import { useBaselineForm } from './hooks/useBaselineForm.js';

export function BaselinePage() {
  const {
    account,
    consent,
    form,
    errors,
    submitError,
    isSubmitting,
    isEditingFromReview,
    currentDate,
    handleBack,
    handleChange,
    handleSubmit,
  } = useBaselineForm();

  if (!account) {
    return (
      <Navigate
        to="/registro/cuenta"
        replace
      />
    );
  }

  if (!consent) {
    return (
      <Navigate
        to="/registro/consentimiento"
        replace
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <header className="flex items-center gap-[var(--space-3)]">
        <button
          type="button"
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border-0 bg-[var(--surface-hover)] p-0 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-border)]"
          onClick={handleBack}
          aria-label={
            isEditingFromReview
              ? 'Cancelar edición y volver a revisión'
              : 'Volver al consentimiento'
          }
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className="text-[13px] font-bold text-[var(--text-secondary)]">
          Línea base
        </span>
      </header>

      <RegistrationStepper currentStep={3} />

      <section className="flex flex-col">
        <span className="mb-[var(--space-2)] font-[var(--font-mono)] text-[10px] font-medium tracking-[0.08em] text-[var(--brand-600)] uppercase">
          Paso 3 de 4
        </span>

        <h1 className="m-0 text-[28px] leading-[1.2] font-extrabold tracking-[-0.025em] text-[var(--text-primary)] max-[370px]:text-[24px]">
          {isEditingFromReview
            ? 'Edita tu información'
            : 'Cuéntanos sobre ti'}
        </h1>

        <p className="mt-[var(--space-2)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          {isEditingFromReview
            ? 'Actualiza los campos necesarios y regresa a la revisión.'
            : 'Esta información permitirá personalizar tu acompañamiento dentro de Brisa.'}
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
              No pudimos guardar la información
            </strong>

            <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">
              {submitError}
            </p>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-[var(--space-6)]" onSubmit={handleSubmit} noValidate>
        <BaselineAcademicSection
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <BaselineConsumptionSection
          form={form}
          errors={errors}
          currentDate={currentDate}
          onChange={handleChange}
        />

        <Button
          type="submit"
          size="large"
          fullWidth
          loading={isSubmitting}
          loadingText={
            isEditingFromReview
              ? 'Guardando cambios...'
              : 'Guardando línea base...'
          }
        >
          {isEditingFromReview
            ? 'Guardar cambios'
            : 'Continuar a revisión'}
        </Button>
      </form>
    </div>
  );
}