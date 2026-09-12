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
      className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="grid gap-[var(--space-5)]">
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
        />
      </div>

      <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
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
