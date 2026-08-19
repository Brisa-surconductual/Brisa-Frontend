import { Navigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';
import { ReviewCard } from '../../components/ReviewCard/index.js';

import { ReviewStatusMessages } from './components/ReviewStatusMessages.jsx';
import { useReviewPage } from './hooks/useReviewPage.js';

import {
  createAcademicRows,
  createAccountRows,
  createConsumptionRows,
} from './utils/reviewRows.js';

export function ReviewPage() {
  const {
    account,
    consent,
    baseline,
    modifiedFields,
    consentIsValid,
    consentRenewed,
    sensitiveModifiedLabels,
    submitError,
    isSubmitting,
    handleBack,
    editSection,
    goToReconsent,
    handleConfirmation,
  } = useReviewPage();

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

  if (!baseline) {
    return (
      <Navigate
        to="/registro/linea-base"
        replace
      />
    );
  }

  const accountRows =
    createAccountRows(account);

  const academicRows =
    createAcademicRows(
      baseline,
      modifiedFields,
    );

  const consumptionRows =
    createConsumptionRows(
      baseline,
      modifiedFields,
    );

  return (
    <div className="mx-auto flex w-full max-w-[620px] flex-col gap-[var(--space-6)]">
      <header className="flex items-center gap-[var(--space-3)]">
        <button
          type="button"
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border-0 bg-[var(--surface-hover)] p-0 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-border)]"
          onClick={handleBack}
          aria-label="Volver a línea base"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className="text-[13px] font-bold text-[var(--text-secondary)]">
          Revisión
        </span>
      </header>

      <RegistrationStepper currentStep={4} />

      <section className="flex flex-col">
        <span className="mb-[var(--space-2)] font-[var(--font-mono)] text-[10px] font-medium tracking-[0.08em] text-[var(--brand-600)] uppercase">
          Paso 4 de 4
        </span>

        <h1 className="m-0 text-[28px] leading-[1.2] font-extrabold tracking-[-0.025em] text-[var(--text-primary)] max-[370px]:text-[24px]">
          Revisa antes de confirmar
        </h1>

        <p className="mt-[var(--space-2)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          Verifica que la información sea correcta.
          Puedes editar las secciones habilitadas
          antes de finalizar.
        </p>
      </section>

      <ReviewStatusMessages
        consentRenewed={consentRenewed}
        consentIsValid={consentIsValid}
        sensitiveModifiedLabels={
          sensitiveModifiedLabels
        }
        hasModifiedFields={
          modifiedFields.length > 0
        }
        submitError={submitError}
        onRenewConsent={goToReconsent}
      />

      <div className="flex flex-col gap-[var(--space-4)]">
        <ReviewCard
          title="Cuenta"
          rows={accountRows}
        />

        <ReviewCard
          title="Datos académicos"
          rows={academicRows}
          onEdit={() =>
            editSection('academic')
          }
        />

        <ReviewCard
          title="Datos de consumo"
          rows={consumptionRows}
          onEdit={() =>
            editSection('consumption')
          }
        />
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-4)] py-[var(--space-3)] text-[11px] leading-[1.5] text-[var(--text-muted)]">
        La contraseña no se muestra ni puede consultarse desde esta pantalla.
      </div>

      <Button
        type="button"
        size="large"
        fullWidth
        loading={isSubmitting}
        loadingText="Confirmando registro..."
        onClick={handleConfirmation}
      >
        {consentIsValid
          ? 'Confirmar y finalizar registro'
          : 'Revisar consentimiento'}
      </Button>
    </div>
  );
}