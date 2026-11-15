import { CircleCheck, CirclePause, Clock } from 'lucide-react';

import { PARTICIPATION_STATUS } from '../../types/participantStatus.js';

/*
 * Estado del participante dentro de la cohorte (RF-125), tal como lo
 * informa la fuente. Ícono y texto acompañan al color; un valor
 * desconocido se muestra tal cual, sin inventar estados.
 */
const NEUTRAL_CLASS =
  'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';

const STATUS_PRESENTATION = Object.freeze({
  [PARTICIPATION_STATUS.ACTIVE]: Object.freeze({
    label: 'Activo',
    Icon: CircleCheck,
    className:
      'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  [PARTICIPATION_STATUS.INACTIVE]: Object.freeze({
    label: 'Inactivo',
    Icon: CirclePause,
    className: NEUTRAL_CLASS,
  }),
  [PARTICIPATION_STATUS.PENDING_VALIDATION]: Object.freeze({
    label: 'Pendiente de validación',
    Icon: Clock,
    className:
      'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
});

export function ParticipantStatusBadge({ status }) {
  const presentation = STATUS_PRESENTATION[status];
  const label = presentation?.label ?? status ?? 'Sin estado';
  const Icon = presentation?.Icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${presentation?.className ?? NEUTRAL_CLASS}`}
    >
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
      <span className="sr-only">Estado en la cohorte: </span>
      {label}
    </span>
  );
}
