import { AlertTriangle, CircleCheck } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { PanelNotice } from '../PanelNotice/index.js';
import { SearchableUserSelect } from '../SearchableUserSelect/SearchableUserSelect';

const GROUP_TITLE_CLASS =
  'm-0 p-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]';

export function AdministrativePauseForm({
  form,
  errors = {},
  formError = '',
  successMessage = '',
  submitDisabled = false,
  onChange,
  onSubmit,
  onCancel,
}) {
  const reasonErrorId = 'administrative-pause-reason-error';

  return (
    <form
      className="flex flex-col gap-[var(--space-6)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      aria-labelledby="pause-form-title"
      onSubmit={onSubmit}
      noValidate
    >
      <div>
        <h2
          id="pause-form-title"
          className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          Información de la pausa
        </h2>
        <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Completa los datos requeridos para registrar la pausa
          administrativa. Los campos con * son obligatorios.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--space-3)]">
        <SearchableUserSelect
          value={form.participantId}
          error={errors.participantId}
          onChange={(selectedId) => {
            // Simulamos el evento para que el hook detecte el cambio del participantId
            onChange({
              target: {
                name: 'participantId',
                value: selectedId
              }
            });
          }}
        />
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-[var(--space-3)] border-0 border-t border-[var(--surface-border)] p-0 pt-[var(--space-5)]">
        <legend className={`${GROUP_TITLE_CLASS} float-left mb-[var(--space-3)] w-full`}>
          Periodo de la pausa
        </legend>

        <div className="clear-both grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
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
      </fieldset>

      <div className="flex flex-col gap-[6px] border-t border-[var(--surface-border)] pt-[var(--space-5)]">
        <label
          className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
          htmlFor="pauseReason"
        >
          Motivo
          <span className="text-[var(--danger-text)]" aria-hidden="true">*</span>
        </label>

        <textarea
          id="pauseReason"
          name="reason"
          rows={4}
          value={form.reason}
          placeholder="Describe el motivo de la pausa"
          className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 placeholder:text-[var(--text-muted)] placeholder:opacity-75 enabled:hover:border-[var(--neutral-300)] focus:border-[var(--brand-400)] focus:shadow-[var(--focus-ring)] focus:outline-none motion-reduce:transition-none ${
            errors.reason
              ? 'border-[var(--danger)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_10%,transparent)]'
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
        <PanelNotice tone="success" icon={CircleCheck} role="status">
          {successMessage}
        </PanelNotice>
      )}

      {formError && (
        <PanelNotice
          tone="danger"
          icon={AlertTriangle}
          title="No se pudo registrar la pausa"
          role="alert"
        >
          {formError}
        </PanelNotice>
      )}

      <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>

        <Button type="submit" disabled={submitDisabled}>
          Registrar pausa
        </Button>
      </div>
    </form>
  );
}
