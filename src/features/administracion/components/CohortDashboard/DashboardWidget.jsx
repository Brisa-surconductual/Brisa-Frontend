import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CircleCheck,
  ClockAlert,
  CloudOff,
  Hourglass,
  Info,
} from 'lucide-react';

import { availabilityOf, viewHasData } from '../../services/cohortDashboard.js';
import { AGGREGATION_STATE } from '../../types/behavioralAggregate.js';
import {
  SECTION_OUTCOME,
  VIEW_AVAILABILITY,
} from '../../types/cohortDashboard.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

import { WidgetStateNotice } from './WidgetStateNotice.jsx';

const BADGE = Object.freeze({
  [VIEW_AVAILABILITY.AVAILABLE]: Object.freeze({
    label: 'Disponible',
    icon: CircleCheck,
    className:
      'border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]',
  }),
  [VIEW_AVAILABILITY.STALE]: Object.freeze({
    label: 'Desactualizada',
    icon: ClockAlert,
    className:
      'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
  [VIEW_AVAILABILITY.NOT_AVAILABLE]: Object.freeze({
    label: 'No disponible',
    icon: CloudOff,
    className:
      'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  }),
});

export function AvailabilityBadge({ availability }) {
  const { label, icon: Icon, className } = BADGE[availability];

  return (
    <span
      className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold whitespace-nowrap ${className}`}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">Estado de la vista: </span>
      {label}
    </span>
  );
}

// Nota breve de una línea dentro del widget.
function WidgetNote({ icon: Icon, tone = 'muted', role, children }) {
  const color =
    tone === 'warning'
      ? 'text-[var(--warning-text)]'
      : 'text-[var(--text-secondary)]';

  return (
    <p
      role={role}
      className={`m-0 flex items-start gap-[var(--space-2)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] ${color}`}
    >
      <Icon
        size={16}
        strokeWidth={1.8}
        className="mt-[2px] shrink-0"
        aria-hidden="true"
      />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function Timestamp({ value }) {
  return (
    <time dateTime={value} className="font-bold">
      {formatAuditTimestamp(value)}
    </time>
  );
}

/*
 * Marco de un widget del panel principal (RF-140): título, estado de
 * disponibilidad y enlace a la vista detallada. Con datos, delega en el
 * resumen compacto (`Summary`), que solo presenta la vista ya
 * interpretada. Sin datos, muestra el estado compacto equivalente al de
 * la vista detallada. Las vistas desactualizadas y las conservadas en
 * caché se identifican de forma explícita. Cada widget se reintenta por
 * separado y aparece con una transición breve (sin ella con movimiento
 * reducido).
 */
export function DashboardWidget({
  id,
  title,
  icon: Icon,
  dimension,
  moduleLabel,
  result,
  isLoading,
  detailPath,
  detailLabel,
  onRetry,
  isDemo,
  Summary,
}) {
  const headingId = `${id}-titulo`;
  const view = result?.view;
  const showsData = !isLoading && viewHasData(view);
  const isStale = availabilityOf(result) === VIEW_AVAILABILITY.STALE;
  const updatedAt = view?.data?.updatedAt ?? view?.lastAvailableAt ?? null;

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={isLoading}
      className="flex h-full min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] transition duration-300 ease-out motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 sm:p-[var(--space-5)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-[var(--space-3)] gap-y-[var(--space-1)]">
        <h2
          id={headingId}
          className="m-0 inline-flex min-w-0 flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
        >
          <span className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-700)]">
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          {title}
          {!isLoading && result && (
            <AvailabilityBadge availability={availabilityOf(result)} />
          )}
        </h2>

        <Link
          to={detailPath}
          className="-mr-[var(--space-2)] inline-flex min-h-[44px] items-center gap-[var(--space-1)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
        >
          {detailLabel}
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </div>

      {isLoading || !result ? (
        <>
          <p role="status" className="sr-only">
            Cargando la vista de {dimension}...
          </p>
          <div
            aria-hidden="true"
            className="flex flex-col gap-[var(--space-3)]"
          >
            {[0, 1, 2].map((row) => (
              <span
                key={row}
                className="block h-[14px] animate-pulse rounded-[var(--radius-full)] bg-[var(--surface-hover)] motion-reduce:animate-none"
              />
            ))}
          </div>
        </>
      ) : showsData ? (
        <>
          {result.outcome === SECTION_OUTCOME.CACHED && (
            <WidgetNote icon={ClockAlert} tone="warning" role="status">
              Vista conservada de la carga del panel del{' '}
              <Timestamp value={result.cachedAt} /> (hora de Colombia).
            </WidgetNote>
          )}

          {isStale && result.outcome !== SECTION_OUTCOME.CACHED && (
            <WidgetNote icon={ClockAlert} tone="warning" role="status">
              {view.lastAvailableAt ? (
                <>
                  Datos desactualizados: se muestra el último registro
                  disponible, del <Timestamp value={view.lastAvailableAt} />{' '}
                  (hora de Colombia).
                </>
              ) : (
                'Datos desactualizados: se muestra la última vista entregada, sin fecha informada.'
              )}
            </WidgetNote>
          )}

          {!isStale &&
            view.aggregationState === AGGREGATION_STATE.UPDATE_ERROR && (
              <WidgetNote icon={AlertTriangle} tone="warning">
                La última actualización de la vista no se completó; se muestran
                los valores entregados.
              </WidgetNote>
            )}

          {!isStale && view.aggregationState === AGGREGATION_STATE.PENDING && (
            <WidgetNote icon={Hourglass}>
              Hay una actualización pendiente; se muestran los valores
              entregados.
            </WidgetNote>
          )}

          {/* Aviso de la fuente (p. ej. usuarios excluidos): no bloquea. */}
          {!isStale && view.message && (
            <WidgetNote icon={Info}>
              Aviso del módulo de {moduleLabel}: {view.message}
            </WidgetNote>
          )}

          <Summary data={view.data} />

          <p className="m-0 mt-auto text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
            Datos agregados: no identifican a ningún participante.{' '}
            {updatedAt ? (
              <>
                Actualizado el <Timestamp value={updatedAt} /> (hora de Colombia
                {isDemo ? '; fecha ficticia de la demostración' : ''}).
              </>
            ) : (
              'Fecha de actualización no disponible.'
            )}
          </p>
        </>
      ) : (
        <WidgetStateNotice
          outcome={result.outcome}
          view={view}
          dimension={dimension}
          moduleLabel={moduleLabel}
          onRetry={onRetry}
        />
      )}
    </section>
  );
}
