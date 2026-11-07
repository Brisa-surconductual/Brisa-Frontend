import { Navigate } from 'react-router-dom';

import { LockKeyhole } from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';
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
      <RegistrationHeader
        onBack={handleBack}
        backLabel="Volver a línea base"
        sectionLabel="Revisión"
        step={4}
        title="Revisa antes de confirmar"
        description="Verifica que la información sea correcta. Puedes editar las secciones habilitadas antes de finalizar."
      />

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

      <p className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
        <LockKeyhole size={15} strokeWidth={1.8} className="mt-[1px] shrink-0" aria-hidden="true" />
        La contraseña no se muestra ni puede consultarse desde esta pantalla.
      </p>

      <div className="border-t border-[var(--surface-border)] pt-[var(--space-5)]">
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
    </div>
  );
}
