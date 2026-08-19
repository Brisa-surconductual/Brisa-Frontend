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
  onAuthorizationChange,
  onSubmit,
}) {
  return (
    <form className="flex flex-col gap-[var(--space-5)]" onSubmit={onSubmit} noValidate>
      <fieldset className="m-0 flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] p-[var(--space-5)]">
        <legend className="px-[var(--space-2)] text-[14px] font-extrabold text-[var(--text-primary)]">
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
          <p className="mt-[calc(var(--space-3)*-1)] mb-0 text-[12px] leading-[1.5] text-[var(--danger-text)]" role="alert">
            Debes aceptar ambas autorizaciones para continuar.
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