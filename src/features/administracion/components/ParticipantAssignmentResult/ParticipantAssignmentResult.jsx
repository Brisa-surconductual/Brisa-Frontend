import { CircleCheck, X } from 'lucide-react';

import { ParticipantStatusBadge } from '../ParticipantStatusBadge/index.js';

/*
 * Resultado de una asignación (RF-125): cada participante con el
 * estado y los motivos que informó la fuente, sin reinterpretarlos.
 * Recibe el foco al aparecer. Nunca afirma un registro definitivo.
 */
export function ParticipantAssignmentResult({ assigned, ref, onDismiss }) {
  const count = assigned.length;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--success-text)]"
    >
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <p className="m-0 flex items-start gap-[var(--space-3)]">
          <CircleCheck size={20} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
          <span>
            <strong className="block">Participantes asignados temporalmente</strong>
            {count} {count === 1 ? 'participante se incorporó' : 'participantes se incorporaron'} con
            el estado que informó la fuente de demostración. Los cambios son
            temporales y no se guardan en el servidor.
          </span>
        </p>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso de asignación"
          className="inline-flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-full)] border-0 bg-transparent text-current hover:bg-[var(--surface-card)]"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0 pl-[var(--space-8)]">
        {assigned.map((participant) => (
          <li key={participant.id} className="flex flex-col gap-[var(--space-1)]">
            <span className="flex flex-wrap items-center gap-[var(--space-2)]">
              <span className="font-[family-name:var(--font-mono)] font-semibold">{participant.code}</span>
              <ParticipantStatusBadge status={participant.participationStatus} />
            </span>

            {participant.pendingReasons?.length > 0 && (
              <span>Motivos de validación pendiente: {participant.pendingReasons.join(' ')}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
