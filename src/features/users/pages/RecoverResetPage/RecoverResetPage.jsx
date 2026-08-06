import { AlertTriangle, ArrowLeft, Info, Timer } from 'lucide-react';

import { RecoverResetForm } from './components/RecoverResetForm.jsx';
import { useRecoverResetPage } from './hooks/useRecoverResetPage.js';
import { formatRecoveryCountdown } from './utils/recoverResetForm.js';

import styles from './RecoverResetPage.module.css';

export function RecoverResetPage() {
  const {
    justRequested,
    form,
    errors,
    submitError,
    isSubmitting,
    remainingMs,
    isExpired,
    isCountdownLow,
    handleChange,
    handleSubmit,
    goBack,
  } = useRecoverResetPage();

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

          <span className={styles.topBarTitle}>Nueva contraseña</span>
        </header>

        <section className={styles.introduction}>
          <h1 className={styles.title}>Restablece tu contraseña</h1>

          <p className={styles.description}>
            Ingresa el código que recibiste en tu correo
          </p>
        </section>

        <div
          className={`${styles.timerBar} ${
            isExpired ? styles.timerBarExpired : ''
          }`}
        >
          <span className={styles.timerLabel}>
            <Timer size={14} strokeWidth={1.8} aria-hidden="true" />
            Código válido por:
          </span>

          <span
            className={`${styles.countdown} ${
              isExpired
                ? styles.countdownExpired
                : isCountdownLow
                  ? styles.countdownLow
                  : ''
            }`}
          >
            {formatRecoveryCountdown(remainingMs)}
          </span>
        </div>

        {isExpired && (
          <div className={styles.warningAlert} role="alert">
            <Timer size={20} strokeWidth={1.8} aria-hidden="true" />

            <div>
              <strong>El código ha expirado</strong>

              <p>Solicita un nuevo código de verificación.</p>
            </div>
          </div>
        )}

        {justRequested && (
          <div className={styles.infoBanner}>
            <Info size={20} strokeWidth={1.8} aria-hidden="true" />

            <p>Si el correo está registrado, recibirás un código.</p>
          </div>
        )}

        {submitError && (
          <div className={styles.alert} role="alert">
            <AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" />

            <div>
              <strong>No pudimos restablecer tu contraseña</strong>

              <p>{submitError}</p>
            </div>
          </div>
        )}

        <RecoverResetForm
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          isExpired={isExpired}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
