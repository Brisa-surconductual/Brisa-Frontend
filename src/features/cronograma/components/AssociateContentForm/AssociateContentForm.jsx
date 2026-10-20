import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

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
}) {
  const hasContentOptions = contentOptions.length > 0;

  return (
    <form
      className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <div>
          <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
            Asociar contenido a esta unidad
          </h2>

          <p className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-muted)]">
            Selecciona el contenido y el rango de disponibilidad en el que estará habilitado.
          </p>
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

        <TextField
          id="associate-content-available-from"
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
          id="associate-content-available-until"
          name="availableUntil"
          type="datetime-local"
          step="60"
          label="Fin de disponibilidad"
          value={form.availableUntil}
          error={errors.availableUntil}
          required
          onChange={onChange}
        />

        {/*
          La región se monta siempre, no solo cuando hay mensaje: si apareciera
          junto con el texto, algunos lectores de pantalla no lo anuncian.
        */}
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

          <Button type="submit">Asociar contenido</Button>
        </div>
      </div>
    </form>
  );
}
