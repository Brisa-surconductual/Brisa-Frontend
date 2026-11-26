import { CalendarRange } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function TemporalUnitForm({
  form,
  errors = {},
  submitText = 'Crear unidad',
  submitLoading = false,
  submitLoadingText = 'Guardando...',
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={submitLoading}
      aria-labelledby="temporal-unit-form-title"
      className="flex flex-col gap-[var(--space-5)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
    >
      <div className="flex items-start gap-[var(--space-3)]">
        <span
          className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <CalendarRange size={18} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <h2
            id="temporal-unit-form-title"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Datos de la unidad
          </h2>
          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
            Los campos con * son obligatorios. La fecha de finalización no
            puede ser anterior a la de inicio.
          </p>
        </div>
      </div>

      <TextField
        id="temporal-unit-name"
        name="name"
        label="Nombre de la unidad"
        placeholder="Ej. Fase 1: Diagnóstico inicial"
        value={form.name}
        error={errors.name}
        onChange={onChange}
        required
      />

      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
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

      <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitLoading}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          loading={submitLoading}
          loadingText={submitLoadingText}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
}
