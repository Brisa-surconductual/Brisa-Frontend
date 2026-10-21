import { useEffect, useId, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

export function ProgramModalityConfirmDialog({
  open,
  eligibility,
  onConfirm,
  onCancel,
  isProcessing = false,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();

    if (!isProcessing) {
      onCancel?.();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current && !isProcessing) {
      onCancel?.();
    }
  }

  const total = eligibility?.total_usuarios_activos ?? 0;
  const completos = eligibility?.con_perfil_completo ?? 0;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto w-[min(calc(100%-32px),460px)] max-w-[460px] border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[rgb(22_21_16/68%)] backdrop:backdrop-blur-[2px]"
    >
      <div className="rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)] shadow-[var(--shadow-lg)]">
        <div className="mb-[var(--space-4)] inline-flex rounded-[var(--radius-full)] bg-[var(--warning-bg)] p-[var(--space-3)] text-[var(--warning-text)]">
          <TriangleAlert size={24} strokeWidth={1.7} aria-hidden="true" />
        </div>

        <h2
          id={titleId}
          className="m-0 text-xl font-extrabold text-[var(--text-primary)]"
        >
          Confirmar transición de modalidad
        </h2>

        <div
          id={descriptionId}
          className="mt-[var(--space-4)] flex flex-col gap-[var(--space-3)] text-sm leading-relaxed text-[var(--text-secondary)]"
        >
          <p className="m-0">
            Se verificaron{' '}
            <strong className="text-[var(--text-primary)]">
              {completos} de {total}
            </strong>{' '}
            participantes activos con perfil clínico completo.
          </p>

          <p className="m-0">
            Esta acción habilitará la modalidad personalizada para los
            participantes activos del programa.
          </p>

          <div className="rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-3)] text-[var(--warning-text)]">
            La transición es unidireccional dentro de este alcance. Las sesiones
            existentes conservarán su información y modalidad histórica.
          </div>

          <p className="m-0 font-semibold text-[var(--text-primary)]">
            ¿Deseas confirmar el cambio de modalidad?
          </p>
        </div>

        <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={isProcessing}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            loading={isProcessing}
            loadingText="Procesando..."
            disabled={!eligibility?.elegible || !onConfirm}
            onClick={onConfirm}
          >
            Confirmar transición
          </Button>
        </div>
      </div>
    </dialog>
  );
}
