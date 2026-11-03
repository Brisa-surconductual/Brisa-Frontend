import { Navigate } from 'react-router-dom';

import { AlertTriangle } from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import { FormNotice } from '../../components/FormNotice/index.js';
import { RegistrationHeader } from '../../components/RegistrationHeader/index.js';

import { BaselineAcademicSection } from './components/BaselineAcademicSection.jsx';
import { BaselineConsumptionSection } from './components/BaselineConsumptionSection.jsx';
import { useBaselineForm } from './hooks/useBaselineForm.js';

export function BaselinePage() {
  const {
    account,
    consent,
    form,
    errors,
    submitError,
    isSubmitting,
    isEditingFromReview,
    currentDate,
    handleBack,
    handleChange,
    handleSubmit,
  } = useBaselineForm();

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

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <RegistrationHeader
        onBack={handleBack}
        backLabel={
          isEditingFromReview
            ? 'Cancelar edición y volver a revisión'
            : 'Volver al consentimiento'
        }
        sectionLabel="Línea base"
        step={3}
        title={
          isEditingFromReview
            ? 'Edita tu información'
            : 'Cuéntanos sobre ti'
        }
        description={
          isEditingFromReview
            ? 'Actualiza los campos necesarios y regresa a la revisión.'
            : 'Esta información permitirá personalizar tu acompañamiento dentro de Brisa.'
        }
      />

      {submitError && (
        <FormNotice
          tone="danger"
          icon={AlertTriangle}
          title="No pudimos guardar la información"
          role="alert"
        >
          {submitError}
        </FormNotice>
      )}

      <form className="flex flex-col gap-[var(--space-6)]" onSubmit={handleSubmit} noValidate>
        <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
          Los campos con * son obligatorios.
        </p>

        <BaselineAcademicSection
          form={form}
          errors={errors}
          onChange={handleChange}
        />

        <BaselineConsumptionSection
          form={form}
          errors={errors}
          currentDate={currentDate}
          onChange={handleChange}
        />

        <div className="border-t border-[var(--surface-border)] pt-[var(--space-5)]">
          <Button
            type="submit"
            size="large"
            fullWidth
            loading={isSubmitting}
            loadingText={
              isEditingFromReview
                ? 'Guardando cambios...'
                : 'Guardando línea base...'
            }
          >
            {isEditingFromReview
              ? 'Guardar cambios'
              : 'Continuar a revisión'}
          </Button>
        </div>
      </form>
    </div>
  );
}
