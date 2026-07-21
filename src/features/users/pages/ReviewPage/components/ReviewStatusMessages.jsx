import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '../../../../../shared/components/ui/Button/index.js';

import styles from './ReviewStatusMessages.module.css';

export function ReviewStatusMessages({
  consentRenewed,
  consentIsValid,
  sensitiveModifiedLabels,
  hasModifiedFields,
  submitError,
  onRenewConsent,
}) {
  const sensitiveChangesDescription =
    sensitiveModifiedLabels.length > 0
      ? `Modificaste información sensible: ${sensitiveModifiedLabels.join(', ')}.`
      : 'El consentimiento actual no se encuentra vigente.';

  return (
    <>
      {consentRenewed && (
        <div
          className={styles.successAlert}
          role="status"
        >
          <CheckCircle2
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              Consentimiento actualizado
            </strong>

            <p>
              Ya puedes confirmar el registro.
            </p>
          </div>
        </div>
      )}

      {!consentIsValid && (
        <div
          className={styles.warningAlert}
          role="alert"
        >
          <ShieldAlert
            size={21}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              Debes aceptar nuevamente el
              consentimiento
            </strong>

            <p>
              {sensitiveChangesDescription}
            </p>

            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={onRenewConsent}
            >
              Actualizar consentimiento
            </Button>
          </div>
        </div>
      )}

      {hasModifiedFields &&
        consentIsValid && (
          <div
            className={styles.infoAlert}
            role="status"
          >
            <Info
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <div>
              <strong>Cambios guardados</strong>

              <p>
                Los campos modificados están
                identificados en las tarjetas de
                revisión.
              </p>
            </div>
          </div>
        )}

      {submitError && (
        <div
          className={styles.errorAlert}
          role="alert"
        >
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div>
            <strong>
              No pudimos finalizar el registro
            </strong>

            <p>{submitError}</p>
          </div>
        </div>
      )}
    </>
  );
}