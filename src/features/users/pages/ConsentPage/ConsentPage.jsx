import {
  Navigate,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

import { ConfirmationDialog } from '../../../../shared/components/ui/ConfirmationDialog/index.js';

import {
  CONSENT_VERSION,
  ConsentDocument,
} from '../../components/ConsentDocument/index.js';

import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';

import { ConsentAuthorizationForm } from './components/ConsentAuthorizationForm.jsx';
import { useConsentPage } from './hooks/useConsentPage.js';

import styles from './ConsentPage.module.css';

export function ConsentPage() {
  const {
    account,
    authorizations,
    attemptedSubmit,
    submitError,
    isSubmitting,
    cancelDialogOpen,
    isCancelling,
    consentIsComplete,
    handleAuthorizationChange,
    handleSubmit,
    handleCancelRegistration,
    openCancelDialog,
    closeCancelDialog,
  } = useConsentPage({
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

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={openCancelDialog}
          aria-label="Cancelar registro y volver"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Consentimiento
        </span>
      </header>

      <RegistrationStepper currentStep={2} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 2 de 4
        </span>

        <h1 className={styles.title}>
          Antes de continuar
        </h1>

        <p className={styles.description}>
          Lee el consentimiento y selecciona
          ambas autorizaciones para continuar
          con tu registro.
        </p>
      </section>

      <div className={styles.accountSummary}>
        <ShieldCheck
          size={20}
          strokeWidth={1.6}
          aria-hidden="true"
        />

        <div>
          <span className={styles.accountLabel}>
            Cuenta provisional
          </span>

          <strong className={styles.accountEmail}>
            {account.email}
          </strong>
        </div>
      </div>

      {submitError && (
        <div
          className={styles.alert}
          role="alert"
        >
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              No pudimos completar la acción
            </strong>

            <p>{submitError}</p>
          </div>
        </div>
      )}

      <ConsentDocument />

      <ConsentAuthorizationForm
        authorizations={authorizations}
        attemptedSubmit={attemptedSubmit}
        consentIsComplete={consentIsComplete}
        isSubmitting={isSubmitting}
        onAuthorizationChange={
          handleAuthorizationChange
        }
        onSubmit={handleSubmit}
        onCancelRegistration={
          openCancelDialog
        }
      />

      <ConfirmationDialog
        open={cancelDialogOpen}
        title="¿Cancelar el registro?"
        description="La cuenta provisional y la información asociada serán eliminadas. Tendrás que comenzar el proceso nuevamente."
        confirmText="Sí, cancelar"
        cancelText="Continuar aquí"
        loading={isCancelling}
        onCancel={closeCancelDialog}
        onConfirm={handleCancelRegistration}
      />
    </div>
  );
}