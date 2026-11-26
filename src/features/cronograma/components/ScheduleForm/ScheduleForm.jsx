import { CalendarPlus, Star } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function ScheduleForm({
  form,
  errors = {},
  isSubmitting = false,
  submitText = 'Crear cronograma',
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      aria-busy={isSubmitting}
      aria-labelledby="schedule-form-title"
      noValidate
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
            <CalendarPlus size={18} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <h2
              id="schedule-form-title"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Información del cronograma
            </h2>

            <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              Completa los datos requeridos para definir el nuevo cronograma.
              Los campos con * son obligatorios.
            </p>
          </div>
        </div>

        <TextField
          id="schedule-name"
          name="name"
          label="Nombre"
          placeholder="Ej. Cronograma base 2026"
          value={form.name}
          error={errors.name}
          onChange={onChange}
          required
        />

        <TextField
          id="schedule-activation-date"
          name="activationDate"
          type="date"
          label="Fecha de activación"
          value={form.activationDate}
          error={errors.activationDate}
          onChange={onChange}
          className="sm:max-w-[280px]"
          required
        />

        <div className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-2)]">
          <Checkbox
            id="schedule-is-base"
            name="isBase"
            checked={form.isBase}
            onChange={onChange}
            aria-describedby="schedule-is-base-hint"
          >
            <span className="inline-flex items-center gap-[var(--space-2)] font-bold">
              <Star
                size={15}
                strokeWidth={1.8}
                className="text-[var(--brand-600)]"
                aria-hidden="true"
              />
              Marcar como cronograma base
            </span>
          </Checkbox>

          <p
            id="schedule-is-base-hint"
            className="mt-0 mb-[var(--space-2)] pr-[var(--space-3)] pl-[45px] text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]"
          >
            Indica si este cronograma será utilizado como cronograma base del
            programa. El base actual se reemplazará cuando actives este
            cronograma, después de configurar sus unidades y contenidos.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Creando cronograma..."
          >
            {submitText}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
