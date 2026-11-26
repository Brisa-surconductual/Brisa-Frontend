import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * Modal de las pantallas administrativas del chat (crear/editar nodo o
 * transición). Efecto de vidrio con los tokens del design system; el cuerpo
 * hace scroll propio y el pie (Cancelar / acción principal) queda fijo. El
 * botón principal envía el formulario `formId` que vive en el cuerpo.
 * Esc, clic fuera y Cancelar llaman a `onRequestClose`: quien lo usa decide
 * si pide confirmación antes de cerrar.
 */
export function ChatAdminModal({
  open,
  title,
  formId,
  submitText,
  saving = false,
  onRequestClose,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function solicitarCierre() {
    if (!saving) onRequestClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto w-[min(calc(100%-32px),640px)] max-w-[640px] overflow-visible border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[color-mix(in_srgb,var(--neutral-900)_45%,transparent)] backdrop:backdrop-blur-[6px]"
      onCancel={(event) => {
        event.preventDefault();
        solicitarCierre();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) solicitarCierre();
      }}
    >
      <div className="flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-[color-mix(in_srgb,var(--surface-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface-card)_82%,transparent)] shadow-[var(--shadow-xl)] backdrop-blur-[16px]">
        <header className="flex items-start gap-[var(--space-3)] border-b border-[color-mix(in_srgb,var(--surface-border)_70%,transparent)] px-[var(--space-5)] py-[var(--space-4)]">
          <h2
            id={titleId}
            className="m-0 min-w-0 flex-1 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="small"
            aria-label="Cerrar"
            disabled={saving}
            onClick={solicitarCierre}
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-5)] py-[var(--space-5)]">
          {children}
        </div>

        <footer className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[color-mix(in_srgb,var(--surface-border)_70%,transparent)] px-[var(--space-5)] py-[var(--space-4)] sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={solicitarCierre}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={saving}
            loadingText="Guardando..."
          >
            {submitText}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
