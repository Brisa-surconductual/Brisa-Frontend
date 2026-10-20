import { useEffect, useId, useRef } from 'react';

import { CheckCircle2, CircleX } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

export function ScheduleActivationDialog({
  open,
  validations = [],
  scheduleName,
  isBase = false,
  isSubmitting = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const canActivate = validations.every((validation) => validation.valid);

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
    if (!isSubmitting) onCancel?.();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-busy={isSubmitting}
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
            Validar y activar {scheduleName || 'cronograma'}
          </h2>

          <p
            id={descriptionId}
            className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-secondary)]"
          >
            Se validarán las unidades temporales y el contenido antes de activar
            el cronograma.
            {isBase &&
              ' Al activarlo, será el base para nuevos estudiantes. Los participantes actuales conservarán su cronograma y progreso.'}
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
              Si la planificación tiene errores, el cronograma seguirá inactivo
              y podrás corregirla.
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-[var(--space-4)] text-[var(--danger-text)]"
          >
            {error}
          </p>
        )}
        <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={onCancel}
            autoFocus
          >
            Cancelar
          </Button>

          <Button
            disabled={!canActivate || isSubmitting}
            aria-busy={isSubmitting}
            onClick={onConfirm}
          >
            Confirmar activación
          </Button>
        </div>
      </div>
    </dialog>
  );
}
