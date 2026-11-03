import { Navigate } from 'react-router-dom';
import { AlertTriangle, CircleCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { ConfirmationDialog } from '../../../../shared/components/ui/ConfirmationDialog/index.js';
import { ConsentDocument } from '../../components/ConsentDocument/index.js';
import { FormNotice } from '../../components/FormNotice/index.js';
import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';
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
      <div className="flex h-[300px] w-full flex-col items-center justify-center gap-[var(--space-3)]" role="status">
        <Loader2 className="animate-spin text-[var(--brand-600)] motion-reduce:animate-none" size={32} aria-hidden="true" />
        <span className="text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
          Cargando consentimiento...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[var(--space-6)]">
      <RegistrationHeader
        onBack={openCancelDialog}
        backLabel={isFromLogin ? "Cancelar y salir" : "Cancelar registro y volver"}
        sectionLabel={isFromLogin ? "Actualización requerida" : "Consentimiento"}
        step={isFromLogin ? undefined : 2}
        title={isFromLogin ? "Nuevo Consentimiento" : "Antes de continuar"}
        description={
          isFromLogin
            ? "Hemos actualizado nuestro documento de consentimiento. Por favor, lee y selecciona ambas autorizaciones para poder acceder a la plataforma."
            : "Lee el consentimiento y selecciona ambas autorizaciones para continuar con tu registro."
        }
      />

      <FormNotice tone="info" icon={ShieldCheck}>
        <span className="block text-[length:var(--font-size-xs)]">
          {isFromLogin ? "Cuenta actual" : "Cuenta provisional"}
        </span>
        <strong className="mt-[2px] block [overflow-wrap:anywhere]">
          {account.email}
        </strong>
      </FormNotice>

      {submitError && (
        <FormNotice
          tone="danger"
          icon={AlertTriangle}
          title="No pudimos completar la acción"
          role="alert"
        >
          {submitError}
        </FormNotice>
      )}

      {successMessage && (
        <FormNotice
          tone="success"
          icon={CircleCheck}
          title="¡Acción exitosa!"
          role="status"
        >
          {successMessage}
        </FormNotice>
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
