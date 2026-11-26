import { AlertTriangle, ShieldCheck } from 'lucide-react';

import { AuthCardShell } from '../../components/AuthCardShell/index.js';
import { FormNotice } from '../../components/FormNotice/index.js';
import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';

import { RecoverRequestForm } from './components/RecoverRequestForm.jsx';
import { useRecoverRequestPage } from './hooks/useRecoverRequestPage.js';

export function RecoverRequestPage() {
  const {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
    goBack,
  } = useRecoverRequestPage();

  return (
    <AuthCardShell>
      <RegistrationHeader
        onBack={goBack}
        eyebrow="Recuperar contraseña"
        title="Recupera tu acceso"
        description="Ingresa tu correo y te enviaremos un código de verificación"
      />

      {submitError && (
        <FormNotice
          tone="danger"
          icon={AlertTriangle}
          title="No pudimos procesar la solicitud"
          role="alert"
        >
          {submitError}
        </FormNotice>
      )}

      <RecoverRequestForm
        form={form}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <p className="m-0 flex items-start justify-center gap-[var(--space-2)] text-center text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
        <ShieldCheck size={15} strokeWidth={1.8} className="mt-[1px] shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
        Por seguridad, no confirmamos si el correo existe en el sistema.
      </p>
    </AuthCardShell>
  );
}
