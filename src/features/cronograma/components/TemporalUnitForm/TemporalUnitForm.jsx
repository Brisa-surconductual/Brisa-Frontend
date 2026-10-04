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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[var(--space-6)]">
      
      <div className="flex flex-col gap-[var(--space-6)]">
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

        <div className="grid grid-cols-1 gap-[var(--space-5)] sm:grid-cols-2">
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
      </div>

      {/* Separador sutil minimalista antes de los botones */}
      <div className="mt-[var(--space-2)] flex flex-col-reverse gap-[var(--space-3)] pt-[var(--space-6)] border-t border-[var(--surface-border)] sm:flex-row sm:justify-end">
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