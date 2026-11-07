import {
  CircleCheck,
  CircleDot,
  CircleHelp,
  Lock,
} from 'lucide-react';

import { TEMPORAL_UNIT_STATUS_LABEL } from '@/features/cronograma/types/scheduleTypes.js';

/*
 * Presentación del estado temporal de una unidad. Ícono y
 * etiqueta acompañan al tono: el color no comunica solo. Un
 * valor desconocido se muestra tal cual.
 */
const STATUS_PRESENTATION = Object.freeze({
  ACTIVA: Object.freeze({
    Icon: CircleDot,
    className: 'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]',
  }),
  COMPLETADA: Object.freeze({
    Icon: CircleCheck,
    className: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  BLOQUEADA: Object.freeze({
    Icon: Lock,
    className: 'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  }),
  POR_DEFINIR: Object.freeze({
    Icon: CircleHelp,
    className: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
});

export function TemporalUnitStatusBadge({ status }) {
  const presentation =
    STATUS_PRESENTATION[status] ?? STATUS_PRESENTATION.POR_DEFINIR;
  const StatusIcon = presentation.Icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${presentation.className}`}
    >
      <StatusIcon size={13} strokeWidth={2} aria-hidden="true" />
      {TEMPORAL_UNIT_STATUS_LABEL[status] ?? status ?? 'Sin estado'}
    </span>
  );
}
