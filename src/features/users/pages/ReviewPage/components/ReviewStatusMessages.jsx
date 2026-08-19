import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '../../../../../shared/components/ui/Button/index.js';

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
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-4)] text-[var(--success-text)]" role="status">
          <CheckCircle2
            size={20}
            strokeWidth={1.8}
            className="mt-px shrink-0"
            aria-hidden="true"
          />

          <div>
            <strong className="block text-[13px]">
              Consentimiento actualizado
            </strong>

            <p className="mt-[3px] mb-0 text-[12px] leading-[1.55]">
              Ya puedes confirmar el registro.
            </p>
          </div>
        </div>
      )}

      {!consentIsValid && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-4)] text-[var(--warning-text)]" role="alert">
          <ShieldAlert
            size={21}
            strokeWidth={1.8}
            className="mt-px shrink-0"
            aria-hidden="true"
          />

          <div>
            <strong className="block text-[13px]">
              Debes aceptar nuevamente el consentimiento
            </strong>

            <p className="mt-[3px] mb-0 text-[12px] leading-[1.55]">
              {sensitiveChangesDescription}
            </p>

            <div className="mt-[var(--space-3)]">
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
        </div>
      )}

      {hasModifiedFields &&
        consentIsValid && (
          <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)] text-[var(--info-text)]" role="status">
            <Info
              size={20}
              strokeWidth={1.8}
              className="mt-px shrink-0"
              aria-hidden="true"
            />

            <div>
              <strong className="block text-[13px]">
                Cambios guardados
              </strong>

              <p className="mt-[3px] mb-0 text-[12px] leading-[1.55]">
                Los campos modificados están identificados en las tarjetas de revisión.
              </p>
            </div>
          </div>
        )}

      {submitError && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)]" role="alert">
          <AlertTriangle
            size={20}
            strokeWidth={1.8}
            className="mt-px shrink-0"
            aria-hidden="true"
          />

          <div>
            <strong className="block text-[13px]">
              No pudimos finalizar el registro
            </strong>

            <p className="mt-[3px] mb-0 text-[12px] leading-[1.55]">
              {submitError}
            </p>
          </div>
        </div>
      )}
    </>
  );
}