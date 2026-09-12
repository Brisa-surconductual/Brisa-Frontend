import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import {
  PSYCHOEDUCATIONAL_RESOURCE_FILE_ACCEPT,
  PSYCHOEDUCATIONAL_RESOURCE_TYPE,
  PSYCHOEDUCATIONAL_RESOURCE_TYPE_OPTIONS,
  isPsychoeducationalFileResourceType,
} from '@/features/cronograma/types/resourceTypes.js';

export function PsychoeducationalResourceForm({
  form,
  errors = {},
  loading = false,
  submitLabel = 'Guardar recurso',
  onChange,
  onFileChange,
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

  const acceptedFileTypes =
    PSYCHOEDUCATIONAL_RESOURCE_FILE_ACCEPT[
      form.type
    ] || undefined;

  return (
    <form
      className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)] md:p-[var(--space-6)]"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="grid gap-[var(--space-5)]">
        <SelectField
          id="psychoeducational-resource-type"
          name="type"
          label="Tipo de recurso"
          value={form.type}
          options={PSYCHOEDUCATIONAL_RESOURCE_TYPE_OPTIONS}
          error={errors.type}
          placeholder="Selecciona un tipo"
          required
          disabled={loading}
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
          disabled={loading}
          onChange={onChange}
        />

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
              className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 placeholder:text-[var(--text-muted)] placeholder:opacity-75 enabled:hover:border-[var(--neutral-300)] focus:border-[var(--brand-400)] focus:outline-none focus:shadow-[0_0_0_3px_rgb(29_131_120/12%)] disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:text-[var(--text-muted)] motion-reduce:transition-none ${
                errors.textContent
                  ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgb(193_59_48/8%)]'
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
                  ? fileErrorId
                  : undefined
              }
              onChange={onFileChange}
            />

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