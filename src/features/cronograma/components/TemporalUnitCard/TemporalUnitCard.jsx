import {
  ArrowRight,
  CalendarDays,
  UserCheck,
} from 'lucide-react';

import { TemporalUnitStatusBadge } from '../TemporalUnitStatusBadge/index.js';

export function TemporalUnitCard({ unit, onViewDetails }) {
  const {
    nombreUnidadTemporal,
    orden,
    fechaInicio,
    fechaFin,
    status,
    esUtilizadoPorUsuario,
  } = unit;

  return (
    <article className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] transition-[border-color] duration-150 hover:border-[var(--brand-300)] motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between md:p-[var(--space-5)]">
      <div className="flex min-w-0 items-start gap-[var(--space-4)]">
        <span
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-bg)] text-[length:var(--font-size-md)] font-extrabold text-[var(--text-secondary)] tabular-nums"
        >
          <span className="sr-only">Orden </span>
          {orden ?? '-'}
        </span>

        <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <h3 className="m-0 text-[length:var(--font-size-base)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
              {nombreUnidadTemporal}
            </h3>

            <TemporalUnitStatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-1)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-[var(--space-2)] tabular-nums">
              <CalendarDays size={15} strokeWidth={1.8} className="text-[var(--text-muted)]" aria-hidden="true" />
              {fechaInicio?.split('T')[0]} — {fechaFin?.split('T')[0]}
            </span>

            {esUtilizadoPorUsuario && (
              <span className="inline-flex items-center gap-[var(--space-1)] font-bold text-[var(--brand-600)]">
                <UserCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                En uso
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-[var(--space-2)] self-start rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none sm:self-center"
      >
        Ver detalles
        <span className="sr-only"> de {nombreUnidadTemporal}</span>
        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </article>
  );
}
