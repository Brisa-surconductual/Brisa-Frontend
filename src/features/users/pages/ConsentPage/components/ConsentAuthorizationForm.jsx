import { Button } from '../../../../../shared/components/ui/Button/index.js';
import { Checkbox } from '../../../../../shared/components/ui/Checkbox/index.js';

const AUTHORIZATIONS_ERROR_ID = 'consent-authorizations-error';

/*
 * Dos autorizaciones independientes y obligatorias (RF-05). El
 * mensaje de error queda ligado al grupo con aria-describedby.
 */
export function ConsentAuthorizationForm({
  authorizations,
  attemptedSubmit,
  consentIsComplete,
  isSubmitting,
  onAuthorizationChange,
  onSubmit,
  onCancelRegistration,
  isFromLogin,
}) {
  const showError = attemptedSubmit && !consentIsComplete;

  return (
    <form className="flex flex-col gap-[var(--space-5)]" onSubmit={onSubmit} noValidate>
      <fieldset
        className="m-0 flex min-w-0 flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)] sm:p-[var(--space-5)]"
        aria-describedby={showError ? AUTHORIZATIONS_ERROR_ID : undefined}
      >
        <legend className="float-left mb-[var(--space-1)] w-full p-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]">
          Autorizaciones obligatorias
        </legend>

        <p className="clear-both m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
          Debes aceptar las dos para continuar.
        </p>

        <Checkbox
          id="personalDataAccepted"
          name="personalDataAccepted"
          className="bg-[var(--surface-card)]"
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
          className="bg-[var(--surface-card)]"
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

      {showError && (
        <p
          id={AUTHORIZATIONS_ERROR_ID}
          className="mt-[calc(var(--space-3)*-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] font-semibold text-[var(--danger-text)]"
          role="alert"
        >
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
          { isFromLogin
            ? 'Cancelar actualización'
            : 'Cancelar registro'
          }
        </Button>
      </div>
    </form>
  );
}
