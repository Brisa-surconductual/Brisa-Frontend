function formatProgressValue(value) {
  return value ?? '—';
}

export function CompletedParticipantProgress({
  participantName,
  email,
  completedWeeks,
  totalWeeks,
  completedDays,
  totalDays,
}) {
  return (
    <section aria-labelledby="completed-participant-title">
      <h2
        id="completed-participant-title"
        className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
      >
        Programa completado
      </h2>

      <article className="mt-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--success-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-[11px] font-semibold text-[var(--text-muted)]">
              Participante
            </p>

            <h3 className="mt-[var(--space-1)] mb-0 text-[16px] font-bold text-[var(--text-primary)]">
              {formatProgressValue(participantName)}
            </h3>

            <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-muted)]">
              {formatProgressValue(email)}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="m-0 text-[13px] font-bold text-[var(--success-text)]">
              {formatProgressValue(completedWeeks)}/
              {formatProgressValue(totalWeeks)}
              {' · '}
              {formatProgressValue(completedDays)}/
              {formatProgressValue(totalDays)}
            </p>

            <span className="mt-[var(--space-2)] inline-flex rounded-[var(--radius-full)] bg-[var(--success-bg)] px-[var(--space-3)] py-[var(--space-1)] text-[10px] font-extrabold tracking-[0.03em] text-[var(--success-text)] uppercase">
              Completado
            </span>
          </div>
        </div>

        <div
          className="mt-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-3)]"
          role="status"
        >
          <p className="m-0 text-[12px] font-bold text-[var(--success-text)]">
            El usuario ha completado la totalidad del cronograma
          </p>
        </div>
      </article>
    </section>
  );
}
