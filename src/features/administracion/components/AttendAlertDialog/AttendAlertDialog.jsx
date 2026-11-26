import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, TriangleAlert } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ATTEND_REASON_MAX, ATTEND_REASON_MIN } from '../../types/pendingAlerts.js';
import { alertTypeLabel } from '../../utils/alertLabels.js';

/*
 * Confirmación de «Marcar como atendida» (RF-147). Abrirlo no envía nada:
 * el POST sale solo con «Confirmar atención». Mientras se procesa no se
 * puede cerrar (ni con Escape ni tocando fuera) hasta conocer el
 * resultado. Mismo patrón visual que ConfirmationDialog, con el campo del
 * motivo (el compartido no admite contenido propio).
 */
export function AttendAlertDialog({
  dialog,
  onChangeReason,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const reasonRef = useRef(null);
  const baseId = useId();
  const titleId = `${baseId}-titulo`;
  const descriptionId = `${baseId}-descripcion`;
  const reasonId = `${baseId}-motivo`;
  const counterId = `${baseId}-contador`;
  const reasonErrorId = `${baseId}-motivo-error`;
  const open = Boolean(dialog);
  const submitting = Boolean(dialog?.submitting);

  useEffect(() => {
    const element = dialogRef.current;

    if (!element) return;
    if (open && !element.open) {
      element.showModal?.();
      reasonRef.current?.focus();
    }
    if (!open && element.open) element.close?.();
  }, [open]);

  function handleCancel(event) {
    event.preventDefault();
    if (!submitting) onCancel();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current && !submitting) onCancel();
  }

  const reason = dialog?.reason ?? '';
  const length = reason.trim().length;
  const typeLabel = dialog ? alertTypeLabel(dialog.alert.type) : '';
  const describedBy = [counterId, dialog?.reasonError ? reasonErrorId : ''].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={submitting || undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto w-[min(calc(100%-32px),480px)] max-w-[480px] overflow-visible border-0 bg-transparent p-0 text-[var(--text-primary)] backdrop:bg-[rgb(22_21_16/68%)] backdrop:backdrop-blur-[2px]"
    >
      {dialog && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
          }}
          className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-lg)] sm:p-[var(--space-6)]"
        >
          <h2 id={titleId} className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
            Marcar alerta como atendida
          </h2>

          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-[var(--space-3)] gap-y-[var(--space-1)] text-[length:var(--font-size-sm)]">
            <dt className="font-semibold text-[var(--text-secondary)]">Tipo</dt>
            <dd className="m-0 font-bold">{typeLabel}</dd>
            <dt className="font-semibold text-[var(--text-secondary)]">Participante</dt>
            <dd className="m-0 font-[var(--font-mono)] font-bold">{dialog.alert.participantCode}</dd>
          </dl>

          <p
            id={descriptionId}
            className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--warning-text)]"
          >
            <TriangleAlert size={18} strokeWidth={1.8} aria-hidden="true" className="mt-[2px] shrink-0" />
            Esta acción es definitiva: la alerta quedará registrada como
            atendida y no podrá revertirse.
          </p>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor={reasonId} className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]">
              Motivo de atención
              <span className="text-[var(--danger-text)]" aria-hidden="true">*</span>
            </label>

            <textarea
              ref={reasonRef}
              id={reasonId}
              rows={4}
              value={reason}
              required
              disabled={submitting}
              aria-invalid={Boolean(dialog.reasonError)}
              aria-describedby={describedBy}
              placeholder="Describe la acción realizada con el participante"
              onChange={(event) => onChangeReason(event.target.value)}
              className={`w-full resize-y rounded-[var(--radius-md)] border-[1.5px] bg-[var(--surface-card)] px-[13px] py-[10px] font-[var(--font-sans)] text-[14px] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-120 placeholder:text-[var(--text-muted)] placeholder:opacity-75 focus:border-[var(--brand-400)] focus:shadow-[var(--focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] motion-reduce:transition-none ${
                dialog.reasonError
                  ? 'border-[var(--danger)]'
                  : 'border-[var(--surface-border)]'
              }`}
            />

            <p id={counterId} className="m-0 text-right text-[11px] text-[var(--text-muted)] tabular-nums">
              {length} / {ATTEND_REASON_MAX} caracteres · mínimo {ATTEND_REASON_MIN}
            </p>

            {dialog.reasonError && (
              <p id={reasonErrorId} role="alert" className="m-0 text-[12px] leading-[1.45] font-semibold text-[var(--danger-text)]">
                {dialog.reasonError}
              </p>
            )}
          </div>

          {dialog.error && (
            <p
              role="alert"
              className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--danger-text)]"
            >
              <AlertTriangle size={18} strokeWidth={1.8} aria-hidden="true" className="mt-[2px] shrink-0" />
              {dialog.error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-[var(--space-3)] max-[370px]:grid-cols-1">
            <Button variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} loadingText="Registrando...">
              Confirmar atención
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
