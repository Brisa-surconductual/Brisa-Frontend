import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function TemporalUnitForm({
  form,
  errors = {},
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <div>
          <h2 className="m-0 text-[18px] font-bold text-[var(--text-primary)]">
            Información de la unidad
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
            Completa los datos requeridos para definir la nueva unidad temporal.
          </p>
        </div>

        <TextField
          id="temporal-unit-name"
          name="name"
          label="Nombre"
          placeholder="Ej. Semana 1 - Introducción"
          value={form.name}
          error={errors.name}
          onChange={onChange}
          required
        />

        <TextField
          id="temporal-unit-order"
          name="order"
          type="number"
          min="1"
          step="1"
          label="Orden"
          placeholder="Ej. 1"
          value={form.order}
          error={errors.order}
          onChange={onChange}
          required
        />

        <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
          <TextField
            id="temporal-unit-start-date"
            name="startDate"
            type="date"
            label="Fecha de inicio"
            value={form.startDate}
            error={errors.startDate}
            onChange={onChange}
            required
          />

          <TextField
            id="temporal-unit-end-date"
            name="endDate"
            type="date"
            label="Fecha de finalización"
            value={form.endDate}
            error={errors.endDate}
            onChange={onChange}
            required
          />
        </div>

        <div className="flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button type="submit">Crear unidad</Button>
        </div>
      </div>
    </form>
  );
}
