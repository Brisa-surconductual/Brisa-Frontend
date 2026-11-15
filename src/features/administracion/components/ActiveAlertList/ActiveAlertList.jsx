import { BellRing, CircleCheck, CircleHelp } from 'lucide-react';

import { alertTypeLabel } from '../../utils/alertLabels.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

/*
 * Alertas activas del participante (RF-128). Solo consulta: muestra el
 * tipo y, si llega con zona horaria, la fecha de generación. No muestra
 * niveles de craving ni otros datos clínicos ni permite atenderlas
 * (RF-147); el historial completo (RF-129) es otra sección de la ficha.
 * Un tipo desconocido se muestra tal cual.
 */

export function ActiveAlertList({ alerts }) {
  if (alerts === null || alerts === undefined) {
    return (
      <p className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
        <CircleHelp size={18} strokeWidth={1.8} aria-hidden="true" />
        No disponible
      </p>
    );
  }

  if (alerts.length === 0) {
    return (
      <p className="m-0 inline-flex w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--success-border)] bg-[var(--success-bg)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-sm)] font-bold text-[var(--success-text)]">
        <CircleCheck size={16} strokeWidth={2} aria-hidden="true" />
        Sin alertas activas
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
      {alerts.map((alert, index) => {
        const generatedLabel = formatAuditTimestamp(alert.generatedAt);

        return (
          <li
            key={`${index}-${alert.type}-${alert.generatedAt}`}
            className="flex flex-wrap items-center justify-between gap-x-[var(--space-3)] gap-y-[var(--space-1)] rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--warning-text)]"
          >
            <span className="inline-flex items-center gap-[var(--space-2)] font-bold [overflow-wrap:anywhere]">
              <BellRing size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              {alertTypeLabel(alert.type)}
            </span>
            <span className="tabular-nums">
              {generatedLabel ? (
                <>
                  Generada el <time dateTime={alert.generatedAt}>{generatedLabel}</time>
                </>
              ) : (
                'Fecha no disponible'
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
