import { Button } from '../../../../../shared/components/ui/Button/index.js';
import { Checkbox } from '../../../../../shared/components/ui/Checkbox/index.js';

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
    <form className="flex flex-col gap-[var(--space-5)]" onSubmit={onSubmit} noValidate>
      <fieldset className="m-0 flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] p-[var(--space-5)]">
        <legend className="px-[var(--space-2)] text-[14px] font-extrabold text-[var(--text-primary)]">
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
          <p className="mt-[calc(var(--space-3)*-1)] mb-0 text-[12px] leading-[1.5] text-[var(--danger-text)]" role="alert">
            Debes aceptar ambas autorizaciones para continuar.
          </p>
        )}

      <div className="flex flex-col gap-[var(--space-3)]">
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