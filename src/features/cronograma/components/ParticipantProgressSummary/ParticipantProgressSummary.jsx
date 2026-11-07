import { CirclePause, CircleDot, Users } from 'lucide-react';

// Solo los indicadores que ya calcula la página: no se añaden
// porcentajes, metas ni tendencias.
const SUMMARY_ITEMS = Object.freeze([
  Object.freeze({
    key: 'totalParticipants',
    label: 'Participantes',
    Icon: Users,
  }),
  Object.freeze({
    key: 'activeParticipants',
    label: 'Activos',
    Icon: CircleDot,
  }),
  Object.freeze({
    key: 'pausedParticipants',
    label: 'En pausa',
    Icon: CirclePause,
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
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Resumen del progreso
      </h2>

      <dl className="m-0 mt-[var(--space-3)] grid gap-[var(--space-3)] sm:grid-cols-3">
        {SUMMARY_ITEMS.map(({ key, label, Icon }) => (
          <div
            key={key}
            className="flex items-center gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)]"
          >
            <span
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]"
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={1.8} />
            </span>

            <div className="flex flex-col-reverse">
              <dt className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
                {label}
              </dt>
              <dd className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold text-[var(--text-primary)] tabular-nums">
                {formatSummaryValue(summary?.[key])}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
