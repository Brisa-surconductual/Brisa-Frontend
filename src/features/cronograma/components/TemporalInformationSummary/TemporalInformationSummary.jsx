import { StatusBadge } from '@/features/cronograma/components/StatusBadge/index.js';

function formatValue(value) {
  return value ?? '—';
}

export function TemporalInformationSummary({
  participantName,
  temporalUnitName,
  temporalUnitOrder,
  calculationDateText,
  elapsedTimeText,
  completed = false,
  message,
}) {
  return (
    <section aria-labelledby="temporal-information-summary-title">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Participante
          </p>

          <h2
            id="temporal-information-summary-title"
            className="mt-[var(--space-1)] mb-0 text-[18px] font-extrabold text-[var(--text-primary)]"
          >
            {formatValue(participantName)}
          </h2>
        </div>

        <StatusBadge
          tone={completed ? 'success' : 'brand'}
          label={completed ? 'Completado' : 'En curso'}
        />
      </div>

      <div className="mt-[var(--space-4)] grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]">
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Unidad temporal
          </p>

          <p className="mt-[var(--space-2)] mb-0 text-[14px] font-bold text-[var(--text-primary)]">
            {formatValue(temporalUnitName)}
          </p>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]">
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Orden de unidad
          </p>

          <p className="mt-[var(--space-2)] mb-0 text-[14px] font-bold text-[var(--text-primary)]">
            {formatValue(temporalUnitOrder)}
          </p>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]">
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Fecha de cálculo
          </p>

          <p className="mt-[var(--space-2)] mb-0 text-[14px] font-bold text-[var(--text-primary)]">
            {formatValue(calculationDateText)}
          </p>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]">
          <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
            Tiempo efectivo
          </p>

          <p className="mt-[var(--space-2)] mb-0 text-[14px] font-bold text-[var(--text-primary)]">
            {formatValue(elapsedTimeText)}
          </p>
        </article>
      </div>

      {message ? (
        <div
          className="mt-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-3)]"
          role="status"
        >
          <p className="m-0 text-[12px] leading-[1.6] text-[var(--info-text)]">
            {message}
          </p>
        </div>
      ) : null}
    </section>
  );
}