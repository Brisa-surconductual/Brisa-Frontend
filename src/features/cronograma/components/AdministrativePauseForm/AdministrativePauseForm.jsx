import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

export function AdministrativePauseForm({
  form,
  errors = {},
  formError = '',
  successMessage = '',
  participantOptions = [],
  onChange,
  onSubmit,
  onCancel,
}) {
  const reasonErrorId = 'administrative-pause-reason-error';

  return (
    <form
      className="mt-[var(--space-6)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <div>
          <h2 className="m-0 text-[18px] font-bold text-[var(--text-primary)]">
            Información de la pausa
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
            Completa los datos requeridos para registrar la pausa
            administrativa.
          </p>
        </div>

        <SelectField
          id="participantId"
          name="participantId"
          label="Participante"
          placeholder="Selecciona un participante"
          options={participantOptions}
          value={form.participantId}
          error={errors.participantId}
          required
          onChange={onChange}
        />

        <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
          <TextField
            id="pauseStartDate"
            name="startDate"
            label="Fecha de inicio"
            type="date"
            value={form.startDate}
            error={errors.startDate}
            required
            onChange={onChange}
          />

          <TextField
            id="pauseEndDate"
            name="endDate"
            label="Fecha de fin"
            type="date"
            value={form.endDate}
            error={errors.endDate}
            required
            onChange={onChange}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label
            className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
            htmlFor="pauseReason"
          >
            Motivo
            <span className="text-[var(--danger-text)]" aria-hidden="true">
              *
            </span>
          </label>

          <textarea
            id="pauseReason"
            name="reason"
            rows={4}
            value={form.reason}
            placeholder="Describe el motivo de la pausa"
            className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 placeholder:text-[var(--text-muted)] placeholder:opacity-75 enabled:hover:border-[var(--neutral-300)] focus:border-[var(--brand-400)] focus:outline-none focus:shadow-[0_0_0_3px_rgb(29_131_120/12%)] motion-reduce:transition-none ${
              errors.reason
                ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgb(193_59_48/8%)]'
                : 'border-[var(--surface-border)]'
            }`}
            required
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? reasonErrorId : undefined}
            onChange={onChange}
          />

          {errors.reason && (
            <p
              id={reasonErrorId}
              className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
              role="alert"
            >
              {errors.reason}
            </p>
          )}
        </div>

        {successMessage && (
          <div
            className="rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-3)]"
            role="status"
            aria-live="polite"
          >
            <p className="m-0 text-[12px] leading-[1.5] font-semibold text-[var(--success-text)]">
              {successMessage}
            </p>
          </div>
        )}
        {formError && (
          <div
            className="rounded-[var(--radius-md)] border border-[var(--danger)] bg-[var(--danger-bg)] p-[var(--space-3)]"
            role="alert"
          >
            <p className="m-0 text-[12px] leading-[1.5] font-semibold text-[var(--danger-text)]">
              {formError}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button type="submit">Registrar pausa</Button>
        </div>
      </div>
    </form>
  );
}
