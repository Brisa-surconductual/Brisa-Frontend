import { CalendarClock, FilePlus2, Info, Link2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * HU-CR-02 / RF-10: asociar un contenido del catálogo a una unidad temporal.
 *
 * La unidad temporal ya fue seleccionada antes de ingresar a esta pantalla.
 * El formulario solo solicita el contenido y su rango de disponibilidad.
 */
export function AssociateContentForm({
  form,
  errors = {},
  contentOptions = [],
  contentHint = '',
  successMessage = '',
  onChange,
  onSubmit,
  onCancel,
  onCreateContent,
  isSubmitting = false,
  unit,
}) {
  const hasContentOptions = contentOptions.length > 0;

  return (
    <form
      className="@container rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      noValidate
      aria-busy={isSubmitting}
      aria-labelledby="associate-content-form-title"
      onSubmit={onSubmit}
    >
      <fieldset
        disabled={isSubmitting}
        className="m-0 flex min-w-0 flex-col gap-[var(--space-5)] border-0 p-0"
      >
        <div className="flex items-start gap-[var(--space-3)]">
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
            aria-hidden="true"
          >
            <Link2 size={18} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <h2
              id="associate-content-form-title"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Programar un contenido
            </h2>

            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              Selecciona el contenido y el rango de disponibilidad en el que
              estará habilitado.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--info-text)]">
          <Info
            size={18}
            strokeWidth={1.8}
            className="mt-[2px] shrink-0"
            aria-hidden="true"
          />

          <div className="flex min-w-0 flex-col gap-[var(--space-1)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]">
            {unit && (
              <p className="m-0 font-semibold">
                Rango permitido (hora de tu dispositivo):{' '}
                {DATE_TIME_FORMAT.format(new Date(unit.startDate))}
                {' — '}
                {DATE_TIME_FORMAT.format(new Date(unit.endDate))}
                .
              </p>
            )}
            <p className="m-0">
              Estas fechas pertenecen a la plantilla. La disponibilidad se
              desplaza según el inicio individual de cada estudiante.
            </p>
          </div>
        </div>

        <SelectField
          id="associate-content-id"
          name="contentId"
          label="Contenido disponible"
          placeholder="Selecciona un contenido..."
          options={contentOptions}
          value={form.contentId}
          error={errors.contentId}
          hint={contentHint}
          disabled={!hasContentOptions}
          required
          onChange={onChange}
        />

        {!hasContentOptions && onCreateContent && (
          <div>
            <Button type="button" onClick={onCreateContent}>
              <FilePlus2 size={18} strokeWidth={1.8} aria-hidden="true" />
              Crear contenido para esta unidad
            </Button>
          </div>
        )}

        <fieldset className="m-0 flex min-w-0 flex-col gap-[var(--space-3)] border-0 p-0">
          <legend className="mb-[var(--space-3)] inline-flex items-center gap-[var(--space-2)] p-0 text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">
            <CalendarClock
              size={16}
              strokeWidth={1.8}
              className="text-[var(--text-muted)]"
              aria-hidden="true"
            />
            Disponibilidad
          </legend>

          <div className="grid grid-cols-1 gap-[var(--space-4)] @lg:grid-cols-2">
            <TextField
              id="associate-content-available-from"
              name="availableFrom"
              type="datetime-local"
              disabled={!hasContentOptions}
              step="60"
              min={unit?.startDate}
              max={unit?.endDate}
              label="Inicio de disponibilidad"
              value={form.availableFrom}
              error={errors.availableFrom}
              required
              onChange={onChange}
            />

            <TextField
              id="associate-content-available-until"
              name="availableUntil"
              type="datetime-local"
              disabled={!hasContentOptions}
              step="60"
              min={unit?.startDate}
              max={unit?.endDate}
              label="Fin de disponibilidad"
              value={form.availableUntil}
              error={errors.availableUntil}
              required
              onChange={onChange}
            />
          </div>
        </fieldset>

        {/*
          La región se monta siempre, no solo cuando hay mensaje: si apareciera
          junto con el texto, algunos lectores de pantalla no lo anuncian.
        */}
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

          <Button type="submit" disabled={!hasContentOptions || isSubmitting}>
            {isSubmitting ? 'Asociando contenido...' : 'Asociar contenido'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
