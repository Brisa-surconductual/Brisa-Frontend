import { useEffect, useId, useRef } from 'react';

import { CheckCircle2, CircleX } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

export function ScheduleActivationDialog({
  open,
  validations = [],
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const canActivate =
    validations.length > 0 &&
    validations.every((validation) => validation.valid);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();
    onCancel?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(calc(100%-32px),520px)] max-w-[520px] overflow-visible border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[rgb(22_21_16/68%)] backdrop:backdrop-blur-[2px]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
    >
      <div className="rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)] shadow-[var(--shadow-lg)]">
        <div>
          <h2
            id={titleId}
            className="m-0 text-[20px] font-extrabold text-[var(--text-primary)]"
          >
            Validar y activar cronograma
          </h2>

          <p
            id={descriptionId}
            className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-secondary)]"
          >
            Revisa las condiciones requeridas antes de activar el cronograma.
          </p>
        </div>

        <div className="mt-[var(--space-5)] flex flex-col gap-[var(--space-3)]">
          {validations.length > 0 ? (
            validations.map((validation) => (
              <div
                key={validation.id}
                className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--surface-border)] p-[var(--space-3)]"
              >
                {validation.valid ? (
                  <CheckCircle2
                    className="mt-[2px] shrink-0 text-[var(--success-text)]"
                    size={20}
                    aria-hidden="true"
                  />
                ) : (
                  <CircleX
                    className="mt-[2px] shrink-0 text-[var(--danger-text)]"
                    size={20}
                    aria-hidden="true"
                  />
                )}

                <div>
                  <p className="m-0 text-[13px] font-semibold text-[var(--text-primary)]">
                    {validation.label}
                  </p>

                  {validation.message && (
                    <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
                      {validation.message}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="m-0 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] p-[var(--space-3)] text-[12px] leading-[1.5] text-[var(--text-secondary)]">
              No hay resultados de validación disponibles.
            </p>
          )}
        </div>

        <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>

          <Button disabled={!canActivate} onClick={onConfirm}>
            Confirmar activación
          </Button>
        </div>
      </div>
    </dialog>
  );
}
