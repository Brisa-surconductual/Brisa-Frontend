import { CircleCheck, CircleDashed } from 'lucide-react';

/*
 * Estado real del cronograma (EstadoCronograma: ACTIVO | INACTIVO).
 * Ícono y texto acompañan al color. Un valor distinto se muestra
 * tal cual, sin inventar estados.
 */
const STATUS_PRESENTATION = Object.freeze({
  ACTIVO: Object.freeze({
    label: 'Activo',
    Icon: CircleCheck,
    className:
      'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  INACTIVO: Object.freeze({
    label: 'Inactivo',
    Icon: CircleDashed,
    className:
      'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  }),
});

const FALLBACK_CLASS =
  'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';

export function ScheduleStatusBadge({ status }) {
  const presentation = STATUS_PRESENTATION[status];
  const label = presentation?.label ?? status ?? 'Sin estado';
  const Icon = presentation?.Icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${presentation?.className ?? FALLBACK_CLASS}`}
    >
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
      {label}
    </span>
  );
}
