import {
  PARTICIPANT_PROGRESS_STATUS,
  PARTICIPANT_PROGRESS_STATUS_LABEL,
} from '@/features/cronograma/types/participantProgressTypes.js';

const STATUS_CLASS = Object.freeze({
  [PARTICIPANT_PROGRESS_STATUS.ACTIVO]:
    'bg-[var(--brand-100)] text-[var(--brand-700)]',

  [PARTICIPANT_PROGRESS_STATUS.EN_PAUSA]:
    'bg-[var(--warning-bg)] text-[var(--warning-text)]',

  [PARTICIPANT_PROGRESS_STATUS.COMPLETADO]:
    'bg-[var(--success-bg)] text-[var(--success-text)]',
});

function formatProgressValue(value) {
  return value ?? '—';
}

export function ParticipantProgressCard({
  participantName,
  temporalUnitName,
  currentWeek,
  currentDay,
  status,
}) {
  const statusLabel =
    PARTICIPANT_PROGRESS_STATUS_LABEL[status] ?? status ?? '—';

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Participante
          </p>

          <h2 className="mt-[var(--space-1)] mb-0 text-[16px] font-bold text-[var(--text-primary)] md:text-[18px]">
            {formatProgressValue(participantName)}
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

      <dl className="mt-[var(--space-4)] grid gap-[var(--space-4)] sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Unidad temporal
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] font-medium text-[var(--text-primary)]">
            {formatProgressValue(temporalUnitName)}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Semana actual
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] font-medium text-[var(--text-primary)]">
            {formatProgressValue(currentWeek)}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold text-[var(--text-muted)]">
            Día actual
          </dt>

          <dd className="mt-[var(--space-1)] ml-0 text-[13px] font-medium text-[var(--text-primary)]">
            {formatProgressValue(currentDay)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
