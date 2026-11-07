import { Save, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { Checkbox } from '@/shared/components/ui/Checkbox/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';

/*
 * Crear o editar un nodo de un flujo en borrador (RF-25). Edita el tipo,
 * el texto, si es el nodo inicial y el orden. Los errores van en texto,
 * junto a cada campo.
 */
export function NodeEditorForm({
  mode,
  values,
  errors,
  saving,
  saveError,
  tiposNodo,
  onChange,
  onSubmit,
  onCancel,
}) {
  const title = mode === 'edit' ? 'Editar nodo' : 'Nuevo nodo';

  return (
    <section
      aria-labelledby="editor-nodo-titulo"
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--brand-200)] bg-[var(--surface-card)] p-[var(--space-5)]"
    >
      <h2
        id="editor-nodo-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        {title}
      </h2>

      <form
        noValidate
        className="flex flex-col gap-[var(--space-4)]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <SelectField
          id="nodo-tipo"
          label="Tipo de nodo"
          required
          disabled={saving}
          value={values.idTipoNodo}
          options={tiposNodo}
          error={errors.idTipoNodo}
          onChange={(event) => onChange('idTipoNodo', event.target.value)}
        />

        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="nodo-texto"
            className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
          >
            Texto del nodo
            <span className="text-[var(--danger-text)]" aria-hidden="true">
              *
            </span>
          </label>

          <textarea
            id="nodo-texto"
            rows={5}
            required
            disabled={saving}
            value={values.texto}
            aria-invalid={Boolean(errors.texto)}
            aria-describedby={errors.texto ? 'nodo-texto-error' : undefined}
            className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] leading-[1.5] text-[var(--text-primary)] focus:border-[var(--brand-400)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] ${
              errors.texto
                ? 'border-[var(--danger)]'
                : 'border-[var(--surface-border)]'
            }`}
            onChange={(event) => onChange('texto', event.target.value)}
          />

          {errors.texto && (
            <p
              id="nodo-texto-error"
              role="alert"
              className="m-0 text-[11px] leading-[1.45] font-semibold text-[var(--danger-text)]"
            >
              {errors.texto}
            </p>
          )}
        </div>

        <TextField
          id="nodo-orden"
          label="Orden"
          type="number"
          inputMode="numeric"
          min={1}
          className="md:max-w-[200px]"
          disabled={saving}
          value={values.orden}
          error={errors.orden}
          hint="Opcional. Número entero desde 1."
          onChange={(event) => onChange('orden', event.target.value)}
        />

        <Checkbox
          id="nodo-inicial"
          checked={values.esNodoInicial}
          disabled={saving}
          onChange={(event) => onChange('esNodoInicial', event.target.checked)}
        >
          Es el nodo inicial del flujo
        </Checkbox>

        {saveError && (
          <ChatAdminNotice
            tone="danger"
            role="alert"
            title="No se pudo guardar el nodo"
          >
            {saveError}
          </ChatAdminNotice>
        )}

        <div className="flex flex-col gap-[var(--space-3)] sm:flex-row">
          <Button
            type="submit"
            size="large"
            loading={saving}
            loadingText="Guardando..."
          >
            <Save size={20} strokeWidth={1.8} aria-hidden="true" />
            Guardar nodo
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="large"
            disabled={saving}
            onClick={onCancel}
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
