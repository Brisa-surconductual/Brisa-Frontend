import { Link } from 'react-router-dom';
import { CalendarRange, ListTree, Pencil, UsersRound } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { CohortPeriod } from '../CohortPeriod/index.js';
import { CohortStatusBadge } from '../CohortStatusBadge/index.js';

/*
 * Tarjeta de consulta de una cohorte (RF-124): nombre, estado,
 * periodo del programa y cronograma asociado. Con `detailPath` ofrece
 * la consulta de sus participantes (RF-125), con `editPath` el acceso a
 * su edición y con `statusAction` el cambio de estado que corresponda
 * ({ label, busyLabel, icon, busy, onClick }).
 */
const LINK_CLASS =
  'inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none';

export function CohortCard({ cohort, detailPath = null, editPath = null, statusAction = null }) {
  const name = cohort.name?.trim() || 'Sin nombre';
  const StatusIcon = statusAction?.icon;

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
            <CohortPeriod startDate={cohort.startDate} endDate={cohort.endDate} />
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

      {(detailPath || editPath || statusAction) && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-[var(--space-2)] border-t border-[var(--surface-border)] pt-[var(--space-3)]">
          {(detailPath || editPath) && (
            <div className="-ml-[var(--space-2)] flex flex-wrap items-center gap-x-[var(--space-1)]">
              {detailPath && (
                <Link to={detailPath} className={LINK_CLASS}>
                  <UsersRound size={16} strokeWidth={1.8} aria-hidden="true" />
                  Ver participantes
                  <span className="sr-only"> de {name}</span>
                </Link>
              )}

              {editPath && (
                <Link to={editPath} className={LINK_CLASS}>
                  <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                  Editar
                  <span className="sr-only"> {name}</span>
                </Link>
              )}
            </div>
          )}

          {statusAction && (
            <Button
              variant="secondary"
              loading={statusAction.busy}
              loadingText={statusAction.busyLabel}
              onClick={statusAction.onClick}
              className="min-h-[44px]"
            >
              {StatusIcon && <StatusIcon size={16} strokeWidth={1.8} aria-hidden="true" />}
              {statusAction.label}
              <span className="sr-only"> {name}</span>
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
