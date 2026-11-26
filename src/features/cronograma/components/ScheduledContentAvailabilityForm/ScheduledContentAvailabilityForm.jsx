import { CalendarClock } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

/*
 * Edición de la disponibilidad de un contenido ya programado. Se
 * monta al pulsar "Editar disponibilidad": el primer campo recibe
 * el foco para continuar con el teclado donde está el formulario.
 */
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
      className="@container rounded-[var(--radius-xl)] border-[1.5px] border-[var(--brand-300)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-md)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      noValidate
      aria-labelledby="availability-form-title"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <div className="flex items-start gap-[var(--space-3)]">
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
            aria-hidden="true"
          >
            <CalendarClock size={18} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <h2
              id="availability-form-title"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Actualizar disponibilidad
            </h2>

            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              Define la fecha y hora en la que el contenido estará disponible
              dentro de la unidad temporal.
            </p>
          </div>
        </div>

        {(contentTitle || temporalUnitName || temporalUnitRange) && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-4)] py-[var(--space-3)]">
            {contentTitle && (
              <p className="m-0 text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                {contentTitle}
              </p>
            )}

            {temporalUnitName && (
              <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
                Unidad temporal: {temporalUnitName}
              </p>
            )}

            {temporalUnitRange && (
              <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
                Rango de la unidad: {temporalUnitRange}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-[var(--space-4)] @lg:grid-cols-2">
          <TextField
            id="scheduled-content-available-from"
            name="availableFrom"
            type="datetime-local"
            step="60"
            label="Inicio de disponibilidad"
            value={form.availableFrom}
            error={errors.availableFrom}
            required
            autoFocus
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
        </div>

        <div role="status" aria-live="polite">
          {successMessage && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[var(--space-4)] py-[var(--space-3)]">
              <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] font-semibold text-[var(--success-text)]">
                {successMessage}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] @md:flex-row @md:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button type="submit">Guardar disponibilidad</Button>
        </div>
      </div>
    </form>
  );
}
