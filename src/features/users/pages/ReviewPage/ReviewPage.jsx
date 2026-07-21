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

import styles from './ReviewPage.module.css';

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
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Volver a línea base"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Revisión
        </span>
      </header>

      <RegistrationStepper currentStep={4} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 4 de 4
        </span>

        <h1 className={styles.title}>
          Revisa antes de confirmar
        </h1>

        <p className={styles.description}>
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

      <div className={styles.cards}>
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

      <div className={styles.privacyNote}>
        La contraseña no se muestra ni puede
        consultarse desde esta pantalla.
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