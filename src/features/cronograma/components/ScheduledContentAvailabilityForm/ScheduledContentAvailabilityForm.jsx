import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function ScheduledContentAvailabilityForm({
  form,
  errors = {},
  contentTitle = '',
  temporalUnitName = '',
  temporalUnitRange = '',
  successMessage = '',
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <div>
          <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
            Actualizar disponibilidad
          </h2>

          <p className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-muted)]">
            Define la fecha y hora en la que el contenido estará disponible
            dentro de la unidad temporal.
          </p>
        </div>

        {(contentTitle || temporalUnitName || temporalUnitRange) && (
          <div className="rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-3)]">
            {contentTitle && (
              <p className="m-0 text-[13px] font-semibold text-[var(--text-primary)]">
                {contentTitle}
              </p>
            )}

            {temporalUnitName && (
              <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-muted)]">
                Unidad temporal: {temporalUnitName}
              </p>
            )}

            {temporalUnitRange && (
              <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-muted)]">
                Rango de la unidad: {temporalUnitRange}
              </p>
            )}
          </div>
        )}

        <TextField
          id="scheduled-content-available-from"
          name="availableFrom"
          type="datetime-local"
          step="60"
          label="Inicio de disponibilidad"
          value={form.availableFrom}
          error={errors.availableFrom}
          required
          onChange={onChange}
        />

        <TextField
          id="scheduled-content-available-until"
          name="availableUntil"
          type="datetime-local"
          step="60"
          label="Fin de disponibilidad"
          value={form.availableUntil}
          error={errors.availableUntil}
          required
          onChange={onChange}
        />

        <div role="status" aria-live="polite">
          {successMessage && (
            <div className="rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-3)]">
              <p className="m-0 text-[12px] leading-[1.5] font-semibold text-[var(--success-text)]">
                {successMessage}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button type="submit">
            Guardar disponibilidad
          </Button>
        </div>
      </div>
    </form>
  );
}
