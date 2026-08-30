import { Button } from '@/shared/components/ui/Button/index.js';

import {
  ADMINISTRATIVE_PAUSE_STATUS,
  ADMINISTRATIVE_PAUSE_STATUS_LABEL,
} from '@/features/cronograma/types/administrativePauseTypes.js';

import { formatScheduleDateRange } from '@/features/cronograma/utils/scheduleDateUtils.js';

const STATUS_CLASS = Object.freeze({
  [ADMINISTRATIVE_PAUSE_STATUS.ACTIVA]:
    'bg-[var(--brand-100)] text-[var(--brand-700)]',

  [ADMINISTRATIVE_PAUSE_STATUS.FINALIZADA]:
    'bg-[var(--success-bg)] text-[var(--success-text)]',

  [ADMINISTRATIVE_PAUSE_STATUS.ANULADA]:
    'bg-[var(--neutral-100)] text-[var(--text-muted)]',
});

export function AdministrativePauseCard({
  participantName,
  startDate,
  endDate,
  reason,
  status,
  canAnnul = false,
  onAnnul,
}) {
  const statusLabel = ADMINISTRATIVE_PAUSE_STATUS_LABEL[status] ?? status;

  const dateRange = formatScheduleDateRange(startDate, endDate);

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Participante
          </p>

          <h2 className="mt-[var(--space-1)] mb-0 text-[16px] font-bold text-[var(--text-primary)] md:text-[18px]">
            {participantName}
          </h2>
        </div>

        <span
          className={`rounded-[var(--radius-full)] px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-extrabold tracking-[0.03em] uppercase ${
            STATUS_CLASS[status] ??
            'bg-[var(--neutral-100)] text-[var(--text-muted)]'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <dl className="mt-[var(--space-4)] grid gap-[var(--space-4)] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Periodo
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] font-medium text-[var(--text-primary)]">
            {dateRange}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Motivo
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] leading-[1.5] text-[var(--text-primary)]">
            {reason}
          </dd>
        </div>
      </dl>

      <div className="mt-[var(--space-4)] flex justify-end">
        <Button variant="danger" disabled={!canAnnul} onClick={onAnnul}>
          Anular
        </Button>
      </div>
    </article>
  );
}
