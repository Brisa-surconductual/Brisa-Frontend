import { Navigate } from 'react-router-dom';

import {
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import {
  ConsentDocument,
} from '../../components/ConsentDocument/index.js';
import { FormNotice } from '../../components/FormNotice/index.js';
import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';

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
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[var(--space-6)]">
      <RegistrationHeader
        onBack={handleBack}
        backLabel="Volver a revisión"
        sectionLabel="Actualizar consentimiento"
        title="Confirma nuevamente tu consentimiento"
        description="Lee el documento vigente y acepta ambas autorizaciones antes de finalizar el registro."
      />

      <SensitiveChangesNotice
        fields={sensitiveFieldLabels}
      />

      {submitError && (
        <FormNotice tone="danger" icon={AlertTriangle} role="alert">
          {submitError}
        </FormNotice>
      )}

      {isLoadingConsent ? (
        <div className="flex h-[300px] flex-col items-center justify-center gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-bg)]" role="status">
          <Loader2 className="animate-spin text-[var(--brand-600)] motion-reduce:animate-none" size={24} aria-hidden="true" />
          <span className="text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">Cargando consentimiento vigente...</span>
        </div>
      ) : loadError ? (
        <div role="alert">
          <FormNotice
            tone="danger"
            icon={AlertTriangle}
            title="Consentimiento no disponible"
            action={
              <Button variant="secondary" onClick={retryLoadConsent}>
                <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
                Reintentar carga
              </Button>
            }
          >
            {loadError}
          </FormNotice>
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
