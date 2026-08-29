import {
  useEffect,
  useId,
  useRef,
} from 'react';

import { TriangleAlert } from 'lucide-react';

import { Button } from '../Button';

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

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

    if (!loading) {
      onCancel();
    }
  }

  function handleBackdropClick(event) {
    if (
      event.target === dialogRef.current &&
      !loading
    ) {
      onCancel();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(calc(100%-32px),400px)] max-w-[400px] overflow-visible border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[rgb(22_21_16/68%)] backdrop:backdrop-blur-[2px]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)] text-center shadow-[var(--shadow-lg)]">
        <span className="mb-[var(--space-4)] inline-flex h-[52px] w-[52px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--danger-bg)] text-[var(--danger-text)]" aria-hidden="true">
          <TriangleAlert
            size={28}
            strokeWidth={1.7}
          />
        </span>

        <h2 id={titleId} className="m-0 text-[18px] font-extrabold text-[var(--text-primary)]">
          {title}
        </h2>

        <p id={descriptionId} className="mt-[var(--space-3)] mb-0 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
          {description}
        </p>

        <div className="mt-[var(--space-6)] grid grid-cols-2 gap-[var(--space-3)] max-[370px]:grid-cols-1">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant="danger"
            loading={loading}
            loadingText="Cancelando..."
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </dialog>
  );
}