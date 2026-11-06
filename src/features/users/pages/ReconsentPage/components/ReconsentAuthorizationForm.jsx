import {
  Button,
} from '../../../../../shared/components/ui/Button/index.js';

import {
  Checkbox,
} from '../../../../../shared/components/ui/Checkbox/index.js';

export function ReconsentAuthorizationForm({
  authorizations,
  attemptedSubmit,
  consentIsComplete,
  isSubmitting,
  disabled = false,
  onAuthorizationChange,
  onSubmit,
}) {
  return (
    <form className="flex flex-col gap-[var(--space-5)]" onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={disabled || isSubmitting} className="m-0 flex min-w-0 flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-4)] sm:p-[var(--space-5)]">
        <legend className="float-left mb-[var(--space-1)] w-full p-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]">
          Renovación de autorizaciones
        </legend>

        <Checkbox
          id="personalDataAccepted"
          name="personalDataAccepted"
          disabled={disabled || isSubmitting}
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
          disabled={disabled || isSubmitting}
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
          <p className="mt-[calc(var(--space-3)*-1)] mb-0 text-[12px] leading-[1.5] text-[var(--danger-text)]" role="alert">
            Debes aceptar ambas autorizaciones para continuar.
          </p>
        )}

      <Button
        type="submit"
        size="large"
        fullWidth
        loading={isSubmitting}
        disabled={disabled}
        loadingText="Actualizando consentimiento..."
      >
        Aceptar y volver a revisión
      </Button>
    </form>
  );
}
