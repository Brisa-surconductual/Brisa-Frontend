import { CircleCheck, CircleDashed, CirclePause } from 'lucide-react';

import { COHORT_STATUS } from '../../types/cohortStatus.js';

/*
 * Estado de la cohorte (RF-124). Ícono y texto acompañan al color;
 * un valor desconocido se muestra tal cual, sin inventar estados.
 */
const NEUTRAL_CLASS =
  'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';

const STATUS_PRESENTATION = Object.freeze({
  [COHORT_STATUS.DRAFT]: Object.freeze({
    label: 'Borrador',
    Icon: CircleDashed,
    className: NEUTRAL_CLASS,
  }),
  [COHORT_STATUS.ACTIVE]: Object.freeze({
    label: 'Activa',
    Icon: CircleCheck,
    className:
      'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  [COHORT_STATUS.INACTIVE]: Object.freeze({
    label: 'Inactiva',
    Icon: CirclePause,
    className:
      'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
});

export function CohortStatusBadge({ status }) {
  const presentation = STATUS_PRESENTATION[status];
  const label = presentation?.label ?? status ?? 'Sin estado';
  const Icon = presentation?.Icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${presentation?.className ?? NEUTRAL_CLASS}`}
    >
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
      <span className="sr-only">Estado: </span>
      {label}
    </span>
  );
}
