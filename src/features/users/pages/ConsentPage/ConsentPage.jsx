import { useState } from 'react';
import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';
import { Checkbox } from '../../../../shared/components/ui/Checkbox/index.js';
import { ConfirmationDialog } from '../../../../shared/components/ui/ConfirmationDialog/index.js';

import {
  acceptConsent,
  deleteProvisionalAccount,
} from '../../api/registrationApi.js';

import {
  CONSENT_VERSION,
  ConsentDocument,
} from '../../components/ConsentDocument/index.js';

import { RegistrationStepper } from '../../components/RegistrationStepper/index.js';
import { useRegistration } from '../../hooks/useRegistration.js';

import styles from './ConsentPage.module.css';

export function ConsentPage() {
  const navigate = useNavigate();

  const {
    account,
    saveConsent,
    resetRegistration,
  } = useRegistration();

  const [personalDataAccepted, setPersonalDataAccepted] =
    useState(false);

  const [
    consumptionHistoryAccepted,
    setConsumptionHistoryAccepted,
  ] = useState(false);

  const [attemptedSubmit, setAttemptedSubmit] =
    useState(false);

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] =
    useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!account) {
    return (
      <Navigate
        to="/registro/cuenta"
        replace
      />
    );
  }

  const consentIsComplete =
    personalDataAccepted &&
    consumptionHistoryAccepted;

  async function handleSubmit(event) {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (!consentIsComplete) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const consent = await acceptConsent({
        userId: account.userId,
        personalDataAccepted,
        consumptionHistoryAccepted,
        consentVersion: CONSENT_VERSION,
      });

      saveConsent(consent);

      navigate('/registro/linea-base');
    } catch {
      setSubmitError(
        'No pudimos guardar tu consentimiento. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelRegistration() {
    setIsCancelling(true);
    setSubmitError('');

    try {
      await deleteProvisionalAccount({
        userId: account.userId,
      });

      resetRegistration();
      setCancelDialogOpen(false);

      navigate('/registro/cuenta', {
        replace: true,
      });
    } catch {
      setCancelDialogOpen(false);
      setSubmitError(
        'No pudimos cancelar el registro. Intenta nuevamente.',
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => setCancelDialogOpen(true)}
          aria-label="Cancelar registro y volver"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Consentimiento
        </span>
      </header>

      <RegistrationStepper currentStep={2} />

      <section className={styles.introduction}>
        <span className={styles.eyebrow}>
          Paso 2 de 4
        </span>

        <h1 className={styles.title}>
          Antes de continuar
        </h1>

        <p className={styles.description}>
          Lee el consentimiento y selecciona ambas
          autorizaciones para continuar con tu registro.
        </p>
      </section>

      <div className={styles.accountSummary}>
        <ShieldCheck
          size={20}
          strokeWidth={1.6}
          aria-hidden="true"
        />

        <div>
          <span className={styles.accountLabel}>
            Cuenta provisional
          </span>

          <strong className={styles.accountEmail}>
            {account.email}
          </strong>
        </div>
      </div>

      {submitError && (
        <div className={styles.alert} role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              No pudimos completar la acción
            </strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <ConsentDocument />

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            Autorizaciones obligatorias
          </legend>

          <Checkbox
            id="personalDataAccepted"
            name="personalDataAccepted"
            checked={personalDataAccepted}
            error={
              attemptedSubmit &&
              !personalDataAccepted
            }
            onChange={(event) => {
              setPersonalDataAccepted(
                event.target.checked,
              );
              setSubmitError('');
            }}
          >
            Acepto el{' '}
            <strong>
              tratamiento de mis datos personales
            </strong>{' '}
            según lo descrito.
          </Checkbox>

          <Checkbox
            id="consumptionHistoryAccepted"
            name="consumptionHistoryAccepted"
            checked={consumptionHistoryAccepted}
            error={
              attemptedSubmit &&
              !consumptionHistoryAccepted
            }
            onChange={(event) => {
              setConsumptionHistoryAccepted(
                event.target.checked,
              );
              setSubmitError('');
            }}
          >
            Acepto el{' '}
            <strong>
              registro de mi historial de consumo
            </strong>{' '}
            para fines de seguimiento del programa.
          </Checkbox>
        </fieldset>

        {attemptedSubmit && !consentIsComplete && (
          <p className={styles.validationError} role="alert">
            Debes aceptar ambas autorizaciones para
            continuar.
          </p>
        )}

        <div className={styles.actions}>
          <Button
            type="submit"
            size="large"
            fullWidth
            loading={isSubmitting}
            loadingText="Guardando consentimiento..."
            disabled={!consentIsComplete}
          >
            Aceptar y continuar
          </Button>

          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => setCancelDialogOpen(true)}
            disabled={isSubmitting}
          >
            Cancelar registro
          </Button>
        </div>
      </form>

      <ConfirmationDialog
        open={cancelDialogOpen}
        title="¿Cancelar el registro?"
        description="La cuenta provisional y la información asociada serán eliminadas. Tendrás que comenzar el proceso nuevamente."
        confirmText="Sí, cancelar"
        cancelText="Continuar aquí"
        loading={isCancelling}
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelRegistration}
      />
    </div>
  );
}