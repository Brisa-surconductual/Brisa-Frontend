import { AlertTriangle } from 'lucide-react';

import { FormNotice } from '../../components/FormNotice/index.js';
import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';

import {
  CreateAccountForm,
} from './components/CreateAccountForm.jsx';

import {
  useCreateAccountPage,
} from './hooks/useCreateAccountPage.js';

export function CreateAccountPage() {
  const {
    form,
    errors,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useCreateAccountPage();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[var(--space-6)]">
      <RegistrationHeader
        step={1}
        title="Crea tu cuenta"
        description="Usa cualquier correo electrónico para comenzar tu proceso en Brisa."
      />

      {submitError && (
        <FormNotice
          tone="danger"
          icon={AlertTriangle}
          title="No pudimos crear tu cuenta"
          role="alert"
        >
          {submitError}
        </FormNotice>
      )}

      <CreateAccountForm
        form={form}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
