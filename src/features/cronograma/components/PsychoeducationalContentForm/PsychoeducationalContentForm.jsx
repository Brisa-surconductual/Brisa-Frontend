import { FilePen } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { PSYCHOEDUCATIONAL_CONTENT_TYPE_OPTIONS } from '@/features/cronograma/types/contentTypes.js';

export function PsychoeducationalContentForm({
  form,
  errors = {},
  submitLabel = 'Guardar contenido',
  loading = false,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      className="flex flex-col gap-[var(--space-5)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      aria-busy={loading}
      aria-labelledby="content-form-title"
      noValidate
    >
      <div className="flex items-start gap-[var(--space-3)]">
        <span
          className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          aria-hidden="true"
        >
          <FilePen size={18} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <h2
            id="content-form-title"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Datos del contenido
          </h2>
          <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
            Los campos con * son obligatorios.
          </p>
        </div>
      </div>

      <TextField
        id="psychoeducational-content-name"
        name="name"
        label="Nombre del contenido"
        value={form.name}
        error={errors.name}
        placeholder="Ej. Manejo de la ansiedad"
        autoComplete="off"
        required
        disabled={loading}
        onChange={onChange}
      />

      <SelectField
        id="psychoeducational-content-type"
        name="type"
        label="Tipo de contenido"
        value={form.type}
        options={PSYCHOEDUCATIONAL_CONTENT_TYPE_OPTIONS}
        error={errors.type}
        placeholder="Selecciona un tipo"
        required
        disabled={loading}
        onChange={onChange}
        className="sm:max-w-[320px]"
      />

      <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          loading={loading}
          loadingText="Guardando..."
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
