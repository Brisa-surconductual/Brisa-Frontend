import { useEffect, useId, useRef } from 'react';

import { Clock } from 'lucide-react';

import { Button } from '../Button';

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
      className="w-[min(calc(100%-32px),340px)] max-w-[340px] overflow-visible border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[rgb(22_21_16/68%)] backdrop:backdrop-blur-[2px]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
    >
      <div className="rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)] text-center shadow-[var(--shadow-lg)]">
        <span className="mb-[var(--space-4)] inline-flex h-[52px] w-[52px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--warning-bg)] text-[var(--warning-text)]" aria-hidden="true">
          <Clock size={28} strokeWidth={1.7} />
        </span>

        <h2 id={titleId} className="m-0 text-[17px] font-extrabold text-[var(--text-primary)]">
          Tu sesión está por cerrarse
        </h2>

        <p id={descriptionId} className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.5] text-[var(--text-secondary)]">
          Por inactividad, tu sesión se cerrará en:
        </p>

        <p className="mt-[var(--space-2)] mb-[var(--space-5)] font-[var(--font-mono)] text-[28px] leading-[1.1] font-bold text-[var(--warning-text)]" role="timer" aria-live="off">
          {remainingSeconds}
          <span className="text-[16px]"> s</span>
        </p>

        <div className="grid grid-cols-2 gap-[var(--space-3)] max-[370px]:grid-cols-1">
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