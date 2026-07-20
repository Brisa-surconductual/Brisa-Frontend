import { useState } from 'react';
import {
  Navigate,
  useNavigate,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';
import { Checkbox } from '../../../../shared/components/ui/Checkbox/index.js';

import { renewRegistrationConsent } from '../../api/registrationApi.js';
import {
  CONSENT_VERSION,
  ConsentDocument,
} from '../../components/ConsentDocument/index.js';
import { useRegistration } from '../../hooks/useRegistration.js';
import {
  getModifiedFieldLabels,
  getSensitiveModifiedFields,
} from '../../services/registrationReview.js';

import styles from './ReconsentPage.module.css';

export function ReconsentPage() {
  const navigate = useNavigate();

  const {
    account,
    consent,
    baseline,
    modifiedFields,
    renewConsent,
  } = useRegistration();

  const [personalDataAccepted, setPersonalDataAccepted] =
    useState(false);

  const [
    consumptionHistoryAccepted,
    setConsumptionHistoryAccepted,
  ] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  if (!account) {
    return (
      <Navigate
        to="/registro/cuenta"
        replace
      />
    );
  }

  if (!baseline) {
    return (
      <Navigate
        to="/registro/linea-base"
        replace
      />
    );
  }

  if (
    consent?.status === 'VIGENTE' ||
    getSensitiveModifiedFields(modifiedFields)
      .length === 0
  ) {
    return (
      <Navigate
        to="/registro/revision"
        replace
      />
    );
  }

  const sensitiveFields =
    getModifiedFieldLabels(
      getSensitiveModifiedFields(modifiedFields),
    );

  const consentIsComplete =
    personalDataAccepted &&
    consumptionHistoryAccepted;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!consentIsComplete) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const renewedConsent =
        await renewRegistrationConsent({
          userId: account.userId,
          personalDataAccepted,
          consumptionHistoryAccepted,
          consentVersion: CONSENT_VERSION,
        });

      renewConsent(renewedConsent);

      navigate('/registro/revision', {
        replace: true,
        state: {
          consentRenewed: true,
        },
      });
    } catch {
      setSubmitError(
        'No pudimos actualizar el consentimiento. Intenta nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() =>
            navigate('/registro/revision')
          }
          aria-label="Volver a revisión"
        >
          <ArrowLeft
            size={20}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </button>

        <span className={styles.topBarTitle}>
          Actualizar consentimiento
        </span>
      </header>

      <div className={styles.warning}>
        <ShieldAlert
          size={22}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <div>
          <strong>
            Modificaste información sensible
          </strong>

          <p>
            Los siguientes cambios requieren una nueva
            aceptación:
          </p>

          <ul>
            {sensitiveFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className={styles.introduction}>
        <h1 className={styles.title}>
          Confirma nuevamente tu consentimiento
        </h1>

        <p className={styles.description}>
          Lee el documento vigente y acepta ambas
          autorizaciones antes de finalizar el registro.
        </p>
      </section>

      {submitError && (
        <div className={styles.error} role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <p>{submitError}</p>
        </div>
      )}

      <ConsentDocument />

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            Renovación de autorizaciones
          </legend>

          <Checkbox
            id="renewPersonalData"
            checked={personalDataAccepted}
            onChange={(event) =>
              setPersonalDataAccepted(
                event.target.checked,
              )
            }
          >
            Confirmo el{' '}
            <strong>
              tratamiento de mis datos actualizados
            </strong>
            .
          </Checkbox>

          <Checkbox
            id="renewConsumptionHistory"
            checked={consumptionHistoryAccepted}
            onChange={(event) =>
              setConsumptionHistoryAccepted(
                event.target.checked,
              )
            }
          >
            Confirmo el{' '}
            <strong>
              registro de mi historial actualizado
            </strong>
            .
          </Checkbox>
        </fieldset>

        <Button
          type="submit"
          size="large"
          fullWidth
          disabled={!consentIsComplete}
          loading={isSubmitting}
          loadingText="Actualizando consentimiento..."
        >
          Aceptar y volver a revisión
        </Button>
      </form>
    </div>
  );
}