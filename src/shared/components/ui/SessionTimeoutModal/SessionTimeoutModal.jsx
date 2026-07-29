import { useEffect, useId, useRef } from 'react';

import { Clock } from 'lucide-react';

import { Button } from '../Button';

import styles from './SessionTimeoutModal.module.css';

export function SessionTimeoutModal({
  open,
  remainingMs,
  onExtend,
  onLogout,
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

  /*
   * Ni Escape ni el clic en el fondo cierran el aviso:
   * seguir en la sesión debe ser una decisión explícita.
   */
  function handleCancel(event) {
    event.preventDefault();
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
    >
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          <Clock size={28} strokeWidth={1.7} />
        </span>

        <h2 id={titleId} className={styles.title}>
          Tu sesión está por cerrarse
        </h2>

        <p id={descriptionId} className={styles.description}>
          Por inactividad, tu sesión se cerrará en:
        </p>

        <p className={styles.countdown} role="timer" aria-live="off">
          {remainingSeconds}
          <span className={styles.unit}> s</span>
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onLogout}>
            Cerrar sesión
          </Button>

          <Button variant="primary" onClick={onExtend}>
            Seguir aquí
          </Button>
        </div>
      </div>
    </dialog>
  );
}
