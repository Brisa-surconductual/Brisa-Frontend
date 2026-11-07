import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import {
  PSYCHOEDUCATIONAL_RESOURCE_FILE_ACCEPT,
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
  PSYCHOEDUCATIONAL_RESOURCE_TYPE_OPTIONS,
  isPsychoeducationalFileResourceType,
} from '@/features/cronograma/types/resourceTypes.js';

import { DestinationModuleSelector } from '@/features/cronograma/components/DestinationModuleSelector/index.js';

export function PsychoeducationalResourceForm({
  form,
  errors = {},
  destinationModules = [],
  loading = false,
  editing = false,
  submitLabel = 'Guardar recurso',
  onChange,
  onFileChange,
  onModuleToggle,
  onSubmit,
  onCancel,
}) {
  const isTextResource =
    form.type ===
    PSYCHOEDUCATIONAL_RESOURCE_TYPE.TEXTO;

  const isFileResource =
    isPsychoeducationalFileResourceType(form.type);

  const textErrorId = 'resource-text-content-error';
  const fileErrorId = 'resource-file-error';
  const fileHintId = 'resource-file-hint';

  const acceptedFileTypes =
    PSYCHOEDUCATIONAL_RESOURCE_FILE_ACCEPT[
      form.type
    ] || undefined;

  return (
    <form
      className="@container rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      aria-busy={loading}
      aria-label={editing ? 'Editar recurso' : 'Agregar recurso'}
      noValidate
    >
      <div className="grid gap-[var(--space-5)]">
        <div className="grid gap-[var(--space-4)] @md:grid-cols-2">
          <SelectField
            id="psychoeducational-resource-type"
            name="type"
            label="Tipo de recurso"
            value={form.type}
            options={PSYCHOEDUCATIONAL_RESOURCE_TYPE_OPTIONS}
            error={errors.type}
            placeholder="Selecciona un tipo"
            required
            disabled={loading || editing}
            onChange={onChange}
          />

          <TextField
            id="psychoeducational-resource-order"
            name="order"
            label="Orden del bloque"
            type="number"
            min="1"
            step="1"
            value={form.order}
            error={errors.order}
            placeholder="Ej. 1"
            required
            disabled={loading || editing}
            onChange={onChange}
          />
        </div>

        {editing && (
          <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            El tipo y el orden no se modifican al editar: para reordenar usa
            los controles de cada bloque.
          </p>
        )}

        {isTextResource && (
          <div className="flex flex-col gap-[6px]">
            <label
              className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
              htmlFor="psychoeducational-resource-text"
            >
              Contenido de texto
              <span
                className="text-[var(--danger-text)]"
                aria-hidden="true"
              >
                *
              </span>
            </label>

            <textarea
              id="psychoeducational-resource-text"
              name="textContent"
              rows={6}
              value={form.textContent}
              placeholder="Escribe el contenido del bloque"
              className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 placeholder:text-[var(--text-muted)] placeholder:opacity-75 enabled:hover:border-[var(--neutral-300)] focus:border-[var(--brand-400)] focus:outline-none focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-muted)] motion-reduce:transition-none ${
                errors.textContent
                  ? 'border-[var(--danger)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_10%,transparent)]'
                  : 'border-[var(--surface-border)]'
              }`}
              required
              disabled={loading}
              aria-invalid={Boolean(
                errors.textContent,
              )}
              aria-describedby={
                errors.textContent
                  ? textErrorId
                  : undefined
              }
              onChange={onChange}
            />

            {errors.textContent && (
              <p
                id={textErrorId}
                className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
                role="alert"
              >
                {errors.textContent}
              </p>
            )}
          </div>
        )}

        {isFileResource && (
          <div className="flex flex-col gap-[6px]">
            <label
              className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
              htmlFor="psychoeducational-resource-file"
            >
              Archivo
              {!form.storageKey && (
                <span
                  className="text-[var(--danger-text)]"
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>

            <input
              id="psychoeducational-resource-file"
              name="file"
              type="file"
              accept={acceptedFileTypes}
              className={`w-full rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[13px] text-[var(--text-primary)] file:mr-[var(--space-3)] file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--brand-50)] file:px-[var(--space-3)] file:py-[var(--space-2)] file:font-bold file:text-[var(--brand-700)] ${
                errors.file
                  ? 'border-[var(--danger)]'
                  : 'border-[var(--surface-border)]'
              }`}
              required={!form.storageKey}
              disabled={loading}
              aria-invalid={Boolean(errors.file)}
              aria-describedby={
                errors.file
                  ? `${fileHintId} ${fileErrorId}`
                  : fileHintId
              }
              onChange={onFileChange}
            />

            {/* Mismo filtro `accept` que ya aplica el campo. */}
            <p
              id={fileHintId}
              className="m-0 text-[11px] text-[var(--text-muted)]"
            >
              {acceptedFileTypes
                ? `Tipo admitido: ${acceptedFileTypes}.`
                : 'Se admite cualquier tipo de archivo.'}
            </p>

            {form.file && (
              <p className="m-0 text-[11px] text-[var(--text-muted)]">
                Archivo seleccionado: {form.file.name}
              </p>
            )}

            {!form.file && form.storageKey && (
              <p className="m-0 text-[11px] text-[var(--text-muted)]">
                El recurso ya tiene un archivo asociado.
                Selecciona otro únicamente si deseas
                reemplazarlo.
              </p>
            )}

            {errors.file && (
              <p
                id={fileErrorId}
                className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
                role="alert"
              >
                {errors.file}
              </p>
            )}
          </div>
        )}

        <DestinationModuleSelector
          modules={destinationModules}
          selectedModuleIds={form.moduleIds}
          error={errors.moduleIds}
          disabled={loading}
          onToggle={onModuleToggle}
        />
      </div>

      <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] @md:flex-row @md:justify-end">
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