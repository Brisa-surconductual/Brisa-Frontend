import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function ScheduleForm({
  form,
  errors = {},
  submitText = 'Crear cronograma',
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
            Información del cronograma
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
            Completa los datos requeridos para definir el nuevo cronograma.
          </p>
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
          required
        />

        <div>
          <Checkbox
            id="schedule-is-base"
            name="isBase"
            checked={form.isBase}
            onChange={onChange}
          >
            Marcar como cronograma base
          </Checkbox>

          <p className="mt-[var(--space-2)] mb-0 text-[11px] leading-[1.5] text-[var(--text-muted)]">
            Indica si este cronograma será utilizado como cronograma base del
            programa.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button type="submit">
            {submitText}
          </Button>
        </div>
      </div>
    </form>
  );
}