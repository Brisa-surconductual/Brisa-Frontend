import { AlertTriangle, ArrowLeft, Clock } from 'lucide-react';

import { LoginForm } from './components/LoginForm.jsx';
import { useLoginPage } from './hooks/useLoginPage.js';

import styles from './LoginPage.module.css';

export function LoginPage() {
  const {
    form,
    errors,
    wasClosedByInactivity,
    submitError,
    isSubmitting,
    handleChange,
    handleSubmit,
    goBack,
    goToRecover,
    goToCreateAccount,
  } = useLoginPage();

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

          <span className={styles.topBarTitle}>Iniciar sesión</span>
        </header>

        <section className={styles.introduction}>
          <h1 className={styles.title}>Bienvenido de nuevo</h1>

          <p className={styles.description}>
            Ingresa con tu correo electrónico
          </p>
        </section>

        {wasClosedByInactivity && (
          <div className={styles.notice} role="status">
            <Clock size={20} strokeWidth={1.8} aria-hidden="true" />

            <div>
              <strong>Cerramos tu sesión por inactividad</strong>

              <p>Ingresa de nuevo para continuar donde ibas.</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className={styles.alert} role="alert">
            <AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" />

            <div>
              <strong>No pudimos iniciar sesión</strong>

              <p>{submitError}</p>
            </div>
          </div>
        )}

        <LoginForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onForgotPassword={goToRecover}
        />

        <p className={styles.registerLink}>
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            className={styles.linkButton}
            onClick={goToCreateAccount}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
}
