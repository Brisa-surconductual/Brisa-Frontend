const SUMMARY_ITEMS = Object.freeze([
  Object.freeze({
    key: 'totalParticipants',
    label: 'Participantes',
  }),
  Object.freeze({
    key: 'activeParticipants',
    label: 'Activos',
  }),
  Object.freeze({
    key: 'pausedParticipants',
    label: 'En pausa',
  }),
]);

function formatSummaryValue(value) {
  return value ?? '—';
}

export function ParticipantProgressSummary({ summary }) {
  return (
    <section aria-labelledby="participant-progress-summary-title">
      <h2
        id="participant-progress-summary-title"
        className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
      >
        Resumen del progreso
      </h2>

      <div className="mt-[var(--space-3)] grid gap-[var(--space-3)] sm:grid-cols-3">
        {SUMMARY_ITEMS.map((item) => (
          <article
            key={item.key}
            className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)]"
          >
            <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
              {item.label}
            </p>

            <p className="mt-[var(--space-2)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)]">
              {formatSummaryValue(summary?.[item.key])}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
