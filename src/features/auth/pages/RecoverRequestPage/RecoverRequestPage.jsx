import { ArrowLeft } from 'lucide-react';

import { RecoverRequestForm } from './components/RecoverRequestForm.jsx';
import { useRecoverRequestPage } from './hooks/useRecoverRequestPage.js';

import styles from './RecoverRequestPage.module.css';

export function RecoverRequestPage() {
  const { form, errors, isSubmitting, handleChange, handleSubmit, goBack } =
    useRecoverRequestPage();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={goBack}
            aria-label="Volver"
          >
            <ArrowLeft size={20} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <span className={styles.topBarTitle}>Recuperar contraseña</span>
        </header>

        <section className={styles.introduction}>
          <h1 className={styles.title}>Recupera tu acceso</h1>

          <p className={styles.description}>
            Ingresa tu correo y te enviaremos un código de verificación
          </p>
        </section>

        <RecoverRequestForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <p className={styles.securityNote}>
          Por seguridad, no confirmamos si el correo existe en el sistema.
        </p>
      </div>
    </div>
  );
}
