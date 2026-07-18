import {
  useEffect,
  useId,
  useRef,
} from 'react';

import { TriangleAlert } from 'lucide-react';

import { Button } from '../Button';

import styles from './ConfirmationDialog.module.css';

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
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          <TriangleAlert
            size={28}
            strokeWidth={1.7}
          />
        </span>

        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>

        <p
          id={descriptionId}
          className={styles.description}
        >
          {description}
        </p>

        <div className={styles.actions}>
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