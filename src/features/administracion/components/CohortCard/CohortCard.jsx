import { CalendarRange, ListTree } from 'lucide-react';

import { formatCohortDate } from '../../utils/formatCohortDate.js';
import { CohortStatusBadge } from '../CohortStatusBadge/index.js';

/*
 * Tarjeta de consulta de una cohorte (RF-124): nombre, estado,
 * periodo del programa y cronograma asociado. Solo lectura: las
 * acciones de gestión llegan en entregas posteriores.
 */
function ProgramDate({ value }) {
  const label = formatCohortDate(value);

  return label ? <time dateTime={value}>{label}</time> : 'Fecha no disponible';
}

export function CohortCard({ cohort }) {
  const name = cohort.name?.trim() || 'Sin nombre';

  return (
    <article className="flex h-full flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <h3 className="m-0 min-w-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {name}
        </h3>

        <CohortStatusBadge status={cohort.status} />
      </div>

      <dl className="m-0 flex flex-col gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <CalendarRange size={16} strokeWidth={1.8} aria-hidden="true" />
            Periodo del programa
          </dt>
          <dd className="m-0 font-semibold text-[var(--text-secondary)] tabular-nums">
            <ProgramDate value={cohort.startDate} />
            <span aria-hidden="true"> – </span>
            <span className="sr-only"> hasta </span>
            <ProgramDate value={cohort.endDate} />
          </dd>
        </div>

        <div className="flex flex-col gap-[var(--space-1)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <ListTree size={16} strokeWidth={1.8} aria-hidden="true" />
            Cronograma asociado
          </dt>
          <dd className="m-0 font-semibold [overflow-wrap:anywhere] text-[var(--text-secondary)]">
            {cohort.scheduleName?.trim() ||
              (cohort.scheduleId ? 'Nombre no disponible' : 'Sin cronograma asociado')}
          </dd>
        </div>
      </dl>
    </article>
  );
}
