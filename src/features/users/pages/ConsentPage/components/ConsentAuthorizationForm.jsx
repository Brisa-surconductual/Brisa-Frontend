import { Button } from '../../../../../shared/components/ui/Button/index.js';
import { Checkbox } from '../../../../../shared/components/ui/Checkbox/index.js';

import styles from './ConsentAuthorizationForm.module.css';

export function ConsentAuthorizationForm({
  authorizations,
  attemptedSubmit,
  consentIsComplete,
  isSubmitting,
  onAuthorizationChange,
  onSubmit,
  onCancelRegistration,
}) {
  return (
    <form
      className={styles.form}
      onSubmit={onSubmit}
      noValidate
    >
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          Autorizaciones obligatorias
        </legend>

        <Checkbox
          id="personalDataAccepted"
          name="personalDataAccepted"
          checked={
            authorizations
              .personalDataAccepted
          }
          error={
            attemptedSubmit &&
            !authorizations
              .personalDataAccepted
          }
          onChange={onAuthorizationChange}
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
          checked={
            authorizations
              .consumptionHistoryAccepted
          }
          error={
            attemptedSubmit &&
            !authorizations
              .consumptionHistoryAccepted
          }
          onChange={onAuthorizationChange}
        >
          Acepto el{' '}
          <strong>
            registro de mi historial de consumo
          </strong>{' '}
          para fines de seguimiento del programa.
        </Checkbox>
      </fieldset>

      {attemptedSubmit &&
        !consentIsComplete && (
          <p
            className={styles.validationError}
            role="alert"
          >
            Debes aceptar ambas autorizaciones
            para continuar.
          </p>
        )}

      <div className={styles.actions}>
        <Button
          type="submit"
          size="large"
          fullWidth
          loading={isSubmitting}
          loadingText="Guardando consentimiento..."
        >
          Aceptar y continuar
        </Button>

        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={onCancelRegistration}
          disabled={isSubmitting}
        >
          Cancelar registro
        </Button>
      </div>
    </form>
  );
}