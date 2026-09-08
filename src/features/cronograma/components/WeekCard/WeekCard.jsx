import {
  TEMPORAL_UNIT_STATUS,
  TEMPORAL_UNIT_STATUS_LABEL,
} from '@/features/cronograma/types/scheduleTypes.js';
import { StatusBadge } from '@/features/cronograma/components/StatusBadge/index.js';
import { DateRange } from '@/features/cronograma/components/DateRange/index.js';

// Mismos tonos que el STATUS_CLASS de TemporalUnitCard, para que la vista del
// participante y la del administrador no se contradigan.
const STATUS_TONE = Object.freeze({
  [TEMPORAL_UNIT_STATUS.COMPLETADA]: 'success',
  [TEMPORAL_UNIT_STATUS.ACTIVA]: 'brand',
  [TEMPORAL_UNIT_STATUS.BLOQUEADA]: 'neutral',
  [TEMPORAL_UNIT_STATUS.POR_DEFINIR]: 'warning',
});

/**
 * Tarjeta de unidad temporal en la vista del participante.
 *
 * `children` es lo que compone cada pantalla: una ProgressBar, la lista de
 * ContentRow, o un EmptyScheduleState cuando la unidad no tiene contenido.
 */
export function WeekCard({
  title,
  subtitle,
  status,
  startDate,
  endDate,
  children,
}) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div className="min-w-0">
          <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-secondary)]">
              {subtitle}
            </p>
          ) : null}

          <p className="mt-[var(--space-1)] mb-0 text-[11px] text-[var(--text-muted)]">
            <DateRange startDate={startDate} endDate={endDate} />
          </p>
        </div>

        <StatusBadge
          tone={STATUS_TONE[status]}
          label={TEMPORAL_UNIT_STATUS_LABEL[status] ?? status}
        />
      </div>

      {children ? (
        <div className="mt-[var(--space-4)] grid gap-[var(--space-3)]">
          {children}
        </div>
      ) : null}
    </article>
  );
}
