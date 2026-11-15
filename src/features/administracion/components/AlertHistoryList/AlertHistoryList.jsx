import { BellRing } from 'lucide-react';

import { RESOLUTION_DISPLAY, resolutionDisplay } from '../../services/alertHistory.js';
import { alertSourceLabel, alertTypeLabel } from '../../utils/alertLabels.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { AlertResolutionBadge } from '../AlertResolutionBadge/index.js';

/*
 * Historial cronológico de alertas (RF-129), ya ordenado por la capa de
 * servicios. Cada registro muestra tipo, estado de resolución, fecha de
 * generación, fecha de resolución cuando aplica y fuente. Las fechas se
 * muestran en hora de Colombia solo si llegan con zona horaria. Solo
 * consulta: sin acciones para atender, resolver, descartar ni eliminar.
 */
function Timestamp({ value }) {
  const label = formatAuditTimestamp(value);

  return label ? <time dateTime={value}>{label}</time> : 'No disponible';
}

function Resolution({ alert }) {
  const display = resolutionDisplay(alert);

  if (display === RESOLUTION_DISPLAY.NONE) return null;

  return (
    <div className="flex flex-wrap gap-x-[var(--space-2)]">
      <dt className="font-semibold text-[var(--text-secondary)]">Resolución:</dt>
      <dd className="m-0 tabular-nums">
        {display === RESOLUTION_DISPLAY.DATE && <Timestamp value={alert.resolvedAt} />}
        {display === RESOLUTION_DISPLAY.UNAVAILABLE && 'No disponible'}
        {display === RESOLUTION_DISPLAY.NOT_RECORDED && 'No registrada'}
      </dd>
    </div>
  );
}

export function AlertHistoryList({ alerts }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
      {alerts.map((alert, index) => (
        <li
          key={`${index}-${alert.type}-${alert.generatedAt}`}
          className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)] shadow-[var(--shadow-sm)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
            <h3 className="m-0 inline-flex min-w-0 items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)] [overflow-wrap:anywhere]">
              <BellRing size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
              {alertTypeLabel(alert.type)}
            </h3>
            <AlertResolutionBadge status={alert.status} />
          </div>

          <dl className="m-0 grid grid-cols-1 gap-[var(--space-1)] text-[length:var(--font-size-sm)] text-[var(--text-primary)] sm:grid-cols-3 sm:gap-[var(--space-3)]">
            <div className="flex flex-wrap gap-x-[var(--space-2)]">
              <dt className="font-semibold text-[var(--text-secondary)]">Generada:</dt>
              <dd className="m-0 tabular-nums"><Timestamp value={alert.generatedAt} /></dd>
            </div>
            <Resolution alert={alert} />
            <div className="flex flex-wrap gap-x-[var(--space-2)]">
              <dt className="font-semibold text-[var(--text-secondary)]">Fuente:</dt>
              <dd className="m-0 [overflow-wrap:anywhere]">{alertSourceLabel(alert.source)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
