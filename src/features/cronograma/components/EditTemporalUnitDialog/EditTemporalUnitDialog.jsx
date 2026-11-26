import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, PencilLine, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { PanelNotice } from '../PanelNotice/index.js';
import { createDialogCancelHandler } from '../../utils/dialogCancel.js';

export const EDIT_UNIT_NAME_ID = 'edit-unit-name';

/*
 * Edición de una unidad temporal en un <dialog> modal nativo:
 * el navegador aporta el foco atrapado y el fondo inerte. Al
 * abrir, el foco va al nombre; al cerrar, vuelve al control que
 * abrió el diálogo. Mientras se guarda no se puede cerrar.
 * Los datos y el envío los decide la página (sin cambios).
 */
export function EditTemporalUnitDialog({
  open,
  form,
  error = '',
  isSubmitting = false,
  onChange,
  onSubmit,
  onClose,
}) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      dialog.querySelector(`#${EDIT_UNIT_NAME_ID}`)?.focus();
    }

    if (!open && dialog.open) {
      dialog.close();
      openerRef.current?.focus?.();
      openerRef.current = null;
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={createDialogCancelHandler({
        isBusy: isSubmitting,
        onClose,
      })}
      className="m-auto w-[min(calc(100%-24px),520px)] max-w-[520px] overflow-visible border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[color-mix(in_srgb,var(--neutral-900)_68%,transparent)] backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[calc(100dvh-24px)] flex-col overflow-y-auto rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)]">
        <div className="flex items-start justify-between gap-[var(--space-3)] border-b border-[var(--surface-border)] px-[var(--space-5)] py-[var(--space-4)]">
          <div className="flex min-w-0 items-start gap-[var(--space-3)]">
            <span
              className="mt-[2px] flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
              aria-hidden="true"
            >
              <PencilLine size={18} strokeWidth={1.8} />
            </span>

            <div className="min-w-0">
              <h2
                id={titleId}
                className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
              >
                Editar unidad temporal
              </h2>
              <p
                id={descriptionId}
                className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]"
              >
                Actualiza el nombre y la vigencia de la unidad.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar edición de la unidad"
            className="-mt-[var(--space-1)] -mr-[var(--space-2)] inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          aria-busy={isSubmitting}
          className="flex flex-col gap-[var(--space-5)] p-[var(--space-5)]"
        >
          {error && (
            <PanelNotice tone="danger" icon={AlertTriangle} role="alert">
              {error}
            </PanelNotice>
          )}

          <TextField
            id={EDIT_UNIT_NAME_ID}
            label="Nombre de la unidad"
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            required
          />

          <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
            <TextField
              id="edit-unit-start-date"
              label="Fecha de inicio"
              name="fecha_inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={onChange}
              required
            />
            <TextField
              id="edit-unit-end-date"
              label="Fecha de finalización"
              name="fecha_fin"
              type="date"
              value={form.fecha_fin}
              onChange={onChange}
              required
            />
          </div>

          <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--surface-border)] pt-[var(--space-4)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Guardando cambios..."
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
