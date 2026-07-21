import {
  Button,
} from '../../../../../shared/components/ui/Button/index.js';

import {
  Checkbox,
} from '../../../../../shared/components/ui/Checkbox/index.js';

import styles from './ReconsentAuthorizationForm.module.css';

export function ReconsentAuthorizationForm({
  authorizations,
  attemptedSubmit,
  consentIsComplete,
  isSubmitting,
  onAuthorizationChange,
  onSubmit,
}) {
  return (
    <form
      className={styles.form}
      onSubmit={onSubmit}
      noValidate
    >
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          Renovación de autorizaciones
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
          Confirmo el{' '}
          <strong>
            tratamiento de mis datos actualizados
          </strong>
          .
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
          Confirmo el{' '}
          <strong>
            registro de mi historial actualizado
          </strong>
          .
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

      <Button
        type="submit"
        size="large"
        fullWidth
        loading={isSubmitting}
        loadingText="Actualizando consentimiento..."
      >
        Aceptar y volver a revisión
      </Button>
    </form>
  );
}