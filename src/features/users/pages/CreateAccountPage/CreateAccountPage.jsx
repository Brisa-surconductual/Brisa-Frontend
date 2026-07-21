import { AlertTriangle } from 'lucide-react';

import {
  BrisaLogo,
} from '../../../../shared/components/brand/BrisaLogo/index.js';

import {
  RegistrationStepper,
} from '../../components/RegistrationStepper/index.js';

import {
  CreateAccountForm,
} from './components/CreateAccountForm.jsx';

import {
  useCreateAccountPage,
} from './hooks/useCreateAccountPage.js';

import styles from './CreateAccountPage.module.css';

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
    <div className={styles.page}>
      <header className={styles.header}>
        <BrisaLogo />
      </header>

      <RegistrationStepper currentStep={1} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 1 de 4
        </span>

        <h1 className={styles.title}>
          Crea tu cuenta
        </h1>

        <p className={styles.description}>
          Usa cualquier correo electrónico para
          comenzar tu proceso en Brisa.
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
              No pudimos crear tu cuenta
            </strong>

            <p>{submitError}</p>
          </div>
        </div>
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