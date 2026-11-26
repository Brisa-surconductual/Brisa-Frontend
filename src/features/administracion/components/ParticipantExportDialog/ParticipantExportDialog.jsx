import { useEffect, useId, useRef } from 'react';
import { FileSpreadsheet, ShieldAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

/*
 * Confirmación de la exportación CSV individual (RF-145). Abrirlo no pide
 * nada al servidor: la descarga sale solo con «Confirmar exportación».
 * Identifica al participante únicamente por su seudónimo. Es un <dialog>
 * modal nativo (foco atrapado y fondo inerte): al abrir, el foco va a
 * «Cancelar», la opción segura; al cerrar vuelve a quien lo abrió.
 * Mientras se genera el archivo no se puede cerrar (ni con Escape ni
 * tocando fuera). Mismo patrón visual que ConfirmationDialog, que no
 * admite este contenido.
 */
export function ParticipantExportDialog({ open, participantCode, exporting = false, onCancel, onConfirm, returnFocusRef }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const baseId = useId();
  const titleId = `${baseId}-titulo`;
  const descriptionId = `${baseId}-descripcion`;

  useEffect(() => {
    const element = dialogRef.current;

    if (!element) return;
    if (open && !element.open) {
      element.showModal?.();
      cancelRef.current?.focus();
    }
    if (!open && element.open) {
      element.close?.();
      returnFocusRef?.current?.focus();
    }
  }, [open, returnFocusRef]);

  function handleCancel(event) {
    event.preventDefault();
    if (!exporting) onCancel();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current && !exporting) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={exporting || undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(calc(100%-32px),520px)] max-w-[520px] overflow-y-auto border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[rgb(22_21_16/68%)] backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-lg)] sm:p-[var(--space-6)]">
          <h2 id={titleId} className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
            <FileSpreadsheet size={20} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-[var(--brand-600)]" />
            Exportar historial en CSV
          </h2>

          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-[var(--space-3)] text-[length:var(--font-size-sm)]">
            <dt className="font-semibold text-[var(--text-secondary)]">Participante</dt>
            <dd className="m-0 font-[family-name:var(--font-mono)] font-bold [overflow-wrap:anywhere]">{participantCode}</dd>
          </dl>

          <div id={descriptionId} className="flex flex-col gap-[var(--space-3)]">
            <p className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--warning-text)]">
              <ShieldAlert size={18} strokeWidth={1.8} aria-hidden="true" className="mt-[2px] shrink-0" />
              El archivo contiene información personal y sensible del
              seguimiento de este participante. Guárdalo y compártelo solo
              con quien esté autorizado.
            </p>
            <ul className="m-0 flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-5)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              <li>
                Incluye solo indicadores cuantitativos por unidad del
                programa: progreso, adherencia, craving promedio y alertas.
                No incluye textos del diario ni del chat.
              </li>
              <li>La descarga quedará registrada en la auditoría.</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-3)] max-[370px]:grid-cols-1">
            <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={exporting}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} loading={exporting} loadingText="Generando CSV...">
              Confirmar exportación
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
