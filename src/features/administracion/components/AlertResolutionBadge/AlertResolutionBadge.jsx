import { BellRing, CircleCheck, CircleHelp, CircleSlash, ScanSearch } from 'lucide-react';

import { ALERT_RESOLUTION_STATUS } from '../../types/participantTracking.js';
import { alertStatusLabel } from '../../utils/alertLabels.js';

/*
 * Estado de resolución de una alerta (RF-129). Ícono y texto acompañan
 * siempre al tono; un estado desconocido se muestra tal cual, en tono
 * neutro, sin interpretarlo. Solo informa: no permite cambiarlo.
 */
const NEUTRAL_CLASS =
  'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';

const STATUS_PRESENTATION = Object.freeze({
  [ALERT_RESOLUTION_STATUS.ACTIVE]: Object.freeze({
    Icon: BellRing,
    className: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
  [ALERT_RESOLUTION_STATUS.IN_REVIEW]: Object.freeze({
    Icon: ScanSearch,
    className: 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
  }),
  [ALERT_RESOLUTION_STATUS.RESOLVED]: Object.freeze({
    Icon: CircleCheck,
    className: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  [ALERT_RESOLUTION_STATUS.DISMISSED]: Object.freeze({ Icon: CircleSlash, className: NEUTRAL_CLASS }),
});

export function AlertResolutionBadge({ status }) {
  const presentation = STATUS_PRESENTATION[status];
  const Icon = presentation?.Icon ?? CircleHelp;

  return (
    <span
      className={`inline-flex w-fit max-w-full items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold [overflow-wrap:anywhere] ${presentation?.className ?? NEUTRAL_CLASS}`}
    >
      <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      <span className="sr-only">Estado de resolución: </span>
      {alertStatusLabel(status)}
    </span>
  );
}
