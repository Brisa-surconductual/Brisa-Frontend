import { Navigate } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

import {
  CONSENT_VERSION,
  ConsentDocument,
} from '../../components/ConsentDocument/index.js';

import {
  ReconsentAuthorizationForm,
} from './components/ReconsentAuthorizationForm.jsx';

import {
  SensitiveChangesNotice,
} from './components/SensitiveChangesNotice.jsx';

import {
  useReconsentPage,
} from './hooks/useReconsentPage.js';

import styles from './ReconsentPage.module.css';

export function ReconsentPage() {
  const {
    account,
    consent,
    baseline,
    authorizations,
    attemptedSubmit,
    submitError,
    isSubmitting,
    sensitiveFieldLabels,
    consentIsComplete,
    shouldRedirectToReview,
    handleAuthorizationChange,
    handleBack,
    handleSubmit,
  } = useReconsentPage({
    consentVersion: CONSENT_VERSION,
  });

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

  if (shouldRedirectToReview) {
    return (
      <Navigate
        to="/registro/revision"
        replace
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Volver a revisión"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Actualizar consentimiento
        </span>
      </header>

      <SensitiveChangesNotice
        fields={sensitiveFieldLabels}
      />

      <section className={styles.introduction}>
        <h1 className={styles.title}>
          Confirma nuevamente tu consentimiento
        </h1>

        <p className={styles.description}>
          Lee el documento vigente y acepta ambas
          autorizaciones antes de finalizar el
          registro.
        </p>
      </section>

      {submitError && (
        <div
          className={styles.error}
          role="alert"
        >
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <p>{submitError}</p>
        </div>
      )}

      <ConsentDocument />

      <ReconsentAuthorizationForm
        authorizations={authorizations}
        attemptedSubmit={attemptedSubmit}
        consentIsComplete={consentIsComplete}
        isSubmitting={isSubmitting}
        onAuthorizationChange={
          handleAuthorizationChange
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}