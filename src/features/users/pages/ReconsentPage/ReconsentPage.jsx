import { Navigate } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import {
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
import { Button } from '../../../../shared/components/ui/Button/index.js';

export function ReconsentPage() {
  const {
    account,
    consent,
    baseline,
    authorizations,
    attemptedSubmit,
    submitError,
    isSubmitting,
    consentData,
    isLoadingConsent,
    loadError,
    retryLoadConsent,
    sensitiveFieldLabels,
    consentIsComplete,
    shouldRedirectToReview,
    handleAuthorizationChange,
    handleBack,
    handleSubmit,
  } = useReconsentPage();

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
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-[var(--space-6)]">
      <header className="flex items-center gap-[var(--space-3)]">
        <button
          type="button"
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border-0 bg-[var(--surface-hover)] p-0 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-border)]"
          onClick={handleBack}
          aria-label="Volver a revisión"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className="text-[13px] font-bold text-[var(--text-secondary)]">
          Actualizar consentimiento
        </span>
      </header>

      <SensitiveChangesNotice
        fields={sensitiveFieldLabels}
      />

      <section className="flex flex-col">
        <h1 className="m-0 text-[25px] leading-[1.25] font-extrabold text-[var(--text-primary)]">
          Confirma nuevamente tu consentimiento
        </h1>

        <p className="mt-[var(--space-2)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          Lee el documento vigente y acepta ambas autorizaciones antes de finalizar el registro.
        </p>
      </section>

      {submitError && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]" role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />

          <p className="m-0 text-[12px]">
            {submitError}
          </p>
        </div>
      )}

      {isLoadingConsent ? (
        <div className="flex h-[300px] items-center justify-center gap-[var(--space-3)]" role="status">
          <Loader2 className="animate-spin text-[var(--brand-600)] motion-reduce:animate-none" size={24} aria-hidden="true" />
          <span className="text-[13px] text-[var(--text-secondary)]">Cargando consentimiento vigente...</span>
        </div>
      ) : loadError ? (
        <div className="flex min-h-[300px] flex-col items-start justify-center gap-[var(--space-3)]" role="alert">
          <p className="m-0 text-[13px] text-[var(--danger-text)]">{loadError}</p>
          <Button variant="secondary" onClick={retryLoadConsent}>Reintentar carga</Button>
        </div>
      ) : (
        <ConsentDocument
          titulo={consentData?.titulo}
          contenido={consentData?.urlContenido}
          version={consentData?.versionConsetimeinto}
        />
      )}

      <ReconsentAuthorizationForm
        authorizations={authorizations}
        attemptedSubmit={attemptedSubmit}
        consentIsComplete={consentIsComplete}
        isSubmitting={isSubmitting}
        disabled={isLoadingConsent || !!loadError || !consentData}
        onAuthorizationChange={
          handleAuthorizationChange
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}
