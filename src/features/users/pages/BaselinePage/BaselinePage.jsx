import { Navigate } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';

import { BaselineAcademicSection } from './components/BaselineAcademicSection.jsx';
import { BaselineConsumptionSection } from './components/BaselineConsumptionSection.jsx';
import { useBaselineForm } from './hooks/useBaselineForm.js';

import styles from './BaselinePage.module.css';

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
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label={
            isEditingFromReview
              ? 'Cancelar edición y volver a revisión'
              : 'Volver al consentimiento'
          }
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Línea base
        </span>
      </header>

      <RegistrationStepper currentStep={3} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 3 de 4
        </span>

        <h1 className={styles.title}>
          {isEditingFromReview
            ? 'Edita tu información'
            : 'Cuéntanos sobre ti'}
        </h1>

        <p className={styles.description}>
          {isEditingFromReview
            ? 'Actualiza los campos necesarios y regresa a la revisión.'
            : 'Esta información permitirá personalizar tu acompañamiento dentro de Brisa.'}
        </p>
      </section>

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
              No pudimos guardar la información
            </strong>

            <p>{submitError}</p>
          </div>
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
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
      </form>
    </div>
  );
}