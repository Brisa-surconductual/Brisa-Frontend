import { Link } from 'react-router-dom';
import { BellRing, ChevronRight, CircleCheck, CircleHelp } from 'lucide-react';

/*
 * Indicadores de seguimiento de un participante (RF-142), solo consulta.
 * Recibe un registro ya reducido a los campos permitidos
 * (services/trackingResponse.js) y muestra EXCLUSIVAMENTE el código
 * seudonimizado, el nivel de progreso, la tasa de adherencia y las
 * alertas activas. Un indicador ausente se indica como no disponible,
 * sin estimarlo. No ofrece editar. Con `detailPath` (construido con la
 * referencia opaca) enlaza a la ficha individual de RF-128.
 */
function formatPercentage(value) {
  return `${Math.round(value)} %`;
}

function PercentageIndicator({ label, value }) {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="m-0 flex flex-col gap-[var(--space-1)]">
        <span className="font-bold text-[var(--text-primary)] tabular-nums">
          {value === null ? 'No disponible' : formatPercentage(value)}
        </span>
        {value !== null && (
          <span aria-hidden="true" className="block h-[6px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]">
            <span className="block h-full rounded-[var(--radius-full)] bg-[var(--brand-500)]" style={{ width: `${value}%` }} />
          </span>
        )}
      </dd>
    </div>
  );
}

const ALERT_PRESENTATION = Object.freeze({
  none: Object.freeze({
    Icon: CircleCheck,
    className: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  some: Object.freeze({
    Icon: BellRing,
    className: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
  unknown: Object.freeze({
    Icon: CircleHelp,
    className: 'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  }),
});

function alertLabel(count) {
  if (count === null) return 'No disponible';
  if (count === 0) return 'Sin alertas activas';

  return `${count} ${count === 1 ? 'alerta activa' : 'alertas activas'}`;
}

function AlertsIndicator({ count }) {
  const tone = count === null ? 'unknown' : count === 0 ? 'none' : 'some';
  const { Icon, className } = ALERT_PRESENTATION[tone];

  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
      <dt className="text-[var(--text-secondary)]">Alertas activas</dt>
      <dd className="m-0">
        <span className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${className}`}>
          <Icon size={14} strokeWidth={2} aria-hidden="true" />
          {alertLabel(count)}
        </span>
      </dd>
    </div>
  );
}

export function TrackingEntryCard({ entry, detailPath = null }) {
  return (
    <article className="flex h-full flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <h3 className="m-0 text-[length:var(--font-size-lg)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
        <span className="sr-only">Participante </span>
        {entry.code ? (
          <span className="font-[family-name:var(--font-mono)]">{entry.code}</span>
        ) : (
          'Código no disponible'
        )}
      </h3>

      <dl className="m-0 flex flex-col gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
        <PercentageIndicator label="Nivel de progreso" value={entry.progress} />
        <PercentageIndicator label="Tasa de adherencia" value={entry.adherence} />
        <AlertsIndicator count={entry.activeAlertCount} />
      </dl>

      {detailPath && (
        <div className="mt-auto border-t border-[var(--surface-border)] pt-[var(--space-3)]">
          <Link
            to={detailPath}
            className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
          >
            Ver ficha
            <span className="sr-only"> de {entry.code || 'participante sin código'}</span>
            <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  );
}
