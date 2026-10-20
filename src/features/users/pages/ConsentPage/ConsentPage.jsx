import { Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { ConfirmationDialog } from '../../../../shared/components/ui/ConfirmationDialog/index.js';
import { ConsentDocument } from '../../components/ConsentDocument/index.js';
import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';
import { ConsentAuthorizationForm } from './components/ConsentAuthorizationForm.jsx';
import { useConsentPage } from './hooks/useConsentPage.js';

export function ConsentPage() {
  const {
    account,
    isFromLogin, 
    consentData,       
    isLoadingConsent,  
    authorizations,
    attemptedSubmit,
    submitError,
    successMessage,
    isSubmitting,
    cancelDialogOpen,
    isCancelling,
    consentIsComplete,
    handleAuthorizationChange,
    handleSubmit,
    handleCancelRegistration,
    openCancelDialog,
    closeCancelDialog,
  } = useConsentPage(); 
  
  if (!account) {
    return <Navigate to="/registro/cuenta" replace />;
  }

  if (isLoadingConsent) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <Loader2 className="animate-spin text-[var(--brand-600)]" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-6)]">
      <header className="flex items-center gap-[var(--space-3)]">
        <button
          type="button"
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border-0 bg-[var(--surface-hover)] p-0 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-border)]"
          onClick={openCancelDialog}
          aria-label={isFromLogin ? "Cancelar y salir" : "Cancelar registro y volver"}
        >
          <ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" />
        </button>

        <span className="text-[13px] font-bold text-[var(--text-secondary)]">
          {isFromLogin ? "Actualización requerida" : "Consentimiento"}
        </span>
      </header>

      {!isFromLogin && <RegistrationStepper currentStep={2} />}

      <section className="flex flex-col">
        {!isFromLogin && (
          <span className="mb-[var(--space-2)] font-[var(--font-mono)] text-[10px] font-medium tracking-[0.08em] text-[var(--brand-600)] uppercase">
            Paso 2 de 4
          </span>
        )}

        <h1 className="m-0 text-[28px] leading-[1.2] font-extrabold tracking-[-0.025em] text-[var(--text-primary)] max-[370px]:text-[24px]">
          {isFromLogin ? "Nuevo Consentimiento" : "Antes de continuar"}
        </h1>

        <p className="mt-[var(--space-2)] mb-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          {isFromLogin 
            ? "Hemos actualizado nuestro documento de consentimiento. Por favor, lee y selecciona ambas autorizaciones para poder acceder a la plataforma." 
            : "Lee el consentimiento y selecciona ambas autorizaciones para continuar con tu registro."
          }
        </p>
      </section>

      <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)] text-[var(--info-text)]">
        <ShieldCheck size={20} strokeWidth={1.6} className="mt-[2px] shrink-0" aria-hidden="true" />
        <div>
          <span className="block text-[11px]">
            {isFromLogin ? "Cuenta actual" : "Cuenta provisional"}
          </span>
          <strong className="mt-[2px] block overflow-wrap-anywhere text-[13px]">
            {account.email}
          </strong>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]" role="alert">
          <AlertTriangle size={20} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />
          <div>
            <strong className="block text-[13px]">No pudimos completar la acción</strong>
            <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">{submitError}</p>
          </div>
        </div>
      )}

      
      {successMessage && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-green-200 bg-green-50 p-[var(--space-4)] text-green-800" role="alert">
          <ShieldCheck size={20} strokeWidth={1.8} className="mt-px shrink-0 text-green-600" aria-hidden="true" />
          <div>
            <strong className="block text-[13px]">¡Acción exitosa!</strong>
            <p className="mt-[3px] mb-0 text-[12px] leading-[1.5]">{successMessage}</p>
          </div>
        </div>
      )}

      <ConsentDocument 
        titulo={consentData?.titulo} 
        contenido={consentData?.urlContenido} 
        version={consentData?.versionConsetimeinto} 
      />

      <ConsentAuthorizationForm
        authorizations={authorizations}
        attemptedSubmit={attemptedSubmit}
        consentIsComplete={consentIsComplete}
        isSubmitting={isSubmitting}
        onAuthorizationChange={handleAuthorizationChange}
        onSubmit={handleSubmit}
        onCancelRegistration={openCancelDialog}
        isFromLogin={isFromLogin}
      />

      <ConfirmationDialog
        open={cancelDialogOpen}
        title={isFromLogin ? "¿Cancelar actualización?" : "¿Cancelar el registro?"}
        description={
          isFromLogin 
            ? "Se cerrará tu sesión actual. Tendrás que aceptar el consentimiento la próxima vez que intentes ingresar."
            : "La cuenta provisional y la información asociada serán eliminadas. Tendrás que comenzar el proceso nuevamente."
        }
        confirmText={isFromLogin ? "Sí, salir" : "Sí, cancelar"}
        cancelText="Continuar aquí"
        loading={isCancelling}
        onCancel={closeCancelDialog}
        onConfirm={handleCancelRegistration}
      />
    </div>
  );
}