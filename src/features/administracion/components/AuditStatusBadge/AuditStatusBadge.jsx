import { CircleCheck, CircleHelp, CircleX, ShieldX } from 'lucide-react';

import { AUDIT_STATUS } from '../../types/auditStatus.js';

/*
 * Estado de una acción auditada (RF-123). Ícono y texto acompañan al
 * color; un valor desconocido se muestra tal cual, sin inventar estados.
 */
const NEUTRAL_CLASS =
  'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';

const STATUS_PRESENTATION = Object.freeze({
  [AUDIT_STATUS.SUCCESS]: Object.freeze({
    label: 'Exitosa',
    Icon: CircleCheck,
    className: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  [AUDIT_STATUS.FAILED]: Object.freeze({
    label: 'Fallida',
    Icon: CircleX,
    className: 'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
  }),
  [AUDIT_STATUS.DENIED]: Object.freeze({
    label: 'Denegada',
    Icon: ShieldX,
    className: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
});

export function AuditStatusBadge({ status }) {
  const presentation = STATUS_PRESENTATION[status];
  const Icon = presentation?.Icon ?? CircleHelp;

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${presentation?.className ?? NEUTRAL_CLASS}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">Estado: </span>
      {presentation?.label ?? (status || 'Sin estado')}
    </span>
  );
}
