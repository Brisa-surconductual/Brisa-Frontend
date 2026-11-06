import {
  ArrowRight,
  CircleCheck,
  CircleDot,
  CircleHelp,
  CirclePause,
} from 'lucide-react';

import {
  PARTICIPANT_PROGRESS_STATUS,
  PARTICIPANT_PROGRESS_STATUS_LABEL,
} from '@/features/cronograma/types/participantProgressTypes.js';

import { StatusChip } from '../StatusChip/index.js';

// Presentación de los estados que calcula la página. Un estado
// desconocido queda neutro y nunca se muestra como completado.
const STATUS_PRESENTATION = Object.freeze({
  [PARTICIPANT_PROGRESS_STATUS.ACTIVO]: Object.freeze({ tone: 'brand', icon: CircleDot }),
  [PARTICIPANT_PROGRESS_STATUS.EN_PAUSA]: Object.freeze({ tone: 'warning', icon: CirclePause }),
  [PARTICIPANT_PROGRESS_STATUS.COMPLETADO]: Object.freeze({ tone: 'success', icon: CircleCheck }),
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
  onViewTemporalInformation,
}) {
  const statusLabel =
    PARTICIPANT_PROGRESS_STATUS_LABEL[status] ?? status ?? 'Sin estado';
  const presentation = STATUS_PRESENTATION[status] ?? {
    tone: 'neutral',
    icon: CircleHelp,
  };

  return (
    <article className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <h3 className="m-0 min-w-0 text-[length:var(--font-size-base)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {formatProgressValue(participantName)}
          </h3>

          <StatusChip tone={presentation.tone} icon={presentation.icon}>
            {statusLabel}
          </StatusChip>
        </div>

        <dl className="m-0 flex flex-wrap gap-x-[var(--space-6)] gap-y-[var(--space-2)] text-[length:var(--font-size-sm)]">
          <div className="flex min-w-0 items-center gap-[var(--space-2)]">
            <dt className="text-[var(--text-muted)]">Unidad temporal</dt>
            <dd className="m-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
              {formatProgressValue(temporalUnitName)}
            </dd>
          </div>

          <div className="flex items-center gap-[var(--space-2)]">
            <dt className="text-[var(--text-muted)]">Semana actual</dt>
            <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
              {formatProgressValue(currentWeek)}
            </dd>
          </div>

          <div className="flex items-center gap-[var(--space-2)]">
            <dt className="text-[var(--text-muted)]">Día actual</dt>
            <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
              {formatProgressValue(currentDay)}
            </dd>
          </div>
        </dl>
      </div>

      {onViewTemporalInformation ? (
        <button
          type="button"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-[var(--space-2)] self-start rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none lg:self-center"
          onClick={onViewTemporalInformation}
        >
          Ver información temporal
          <span className="sr-only"> de {formatProgressValue(participantName)}</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}
