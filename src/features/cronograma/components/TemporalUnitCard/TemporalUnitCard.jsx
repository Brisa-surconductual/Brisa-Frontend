import {
  TEMPORAL_UNIT_STATUS,
  TEMPORAL_UNIT_STATUS_LABEL,
} from '@/features/cronograma/types/scheduleTypes.js';
import {
  formatScheduleDateRange,
} from '@/features/cronograma/utils/scheduleDateUtils.js';

const STATUS_CLASS = Object.freeze({
  [TEMPORAL_UNIT_STATUS.COMPLETADA]:
    'bg-[var(--success-bg)] text-[var(--success-text)]',

  [TEMPORAL_UNIT_STATUS.ACTIVA]:
    'bg-[var(--brand-100)] text-[var(--brand-700)]',

  [TEMPORAL_UNIT_STATUS.BLOQUEADA]:
    'bg-[var(--neutral-100)] text-[var(--text-muted)]',

  [TEMPORAL_UNIT_STATUS.POR_DEFINIR]:
    'bg-[var(--warning-bg)] text-[var(--warning-text)]',
});

export function TemporalUnitCard({
  name,
  status,
  startDate,
  endDate,
  activityCount,
  onViewDetails,
}) {
  const statusLabel =
    TEMPORAL_UNIT_STATUS_LABEL[status] ?? status;

  const dateRange = formatScheduleDateRange(
    startDate,
    endDate,
  );

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <h2 className="m-0 text-[16px] font-bold text-[var(--text-primary)] md:text-[18px]">
          {name}
        </h2>

        <span
          className={`rounded-[var(--radius-full)] px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-extrabold tracking-[0.03em] uppercase ${
            STATUS_CLASS[status] ??
            'bg-[var(--neutral-100)] text-[var(--text-muted)]'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="mt-[var(--space-4)] grid gap-[var(--space-3)] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Fechas
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] font-medium text-[var(--text-primary)]">
            {dateRange}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Actividades
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] font-medium text-[var(--text-primary)]">
            {activityCount}
          </dd>
        </div>
      </dl>
        <div className="mt-[var(--space-4)] flex justify-end">
          <button
            type="button"
            className="rounded-[var(--radius-md)] border border-[var(--brand-500)] bg-transparent px-[var(--space-3)] py-[var(--space-2)] text-[12px] font-bold text-[var(--brand-600)] transition-[background-color,color] duration-120 hover:bg-[var(--brand-50)] motion-reduce:transition-none"
            onClick={onViewDetails}
          >
            Ver detalle
          </button>
        </div>
    </article>
  );
}