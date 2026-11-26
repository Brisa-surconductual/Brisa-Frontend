import { BellRing, CheckCheck, Clock, UserRound } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { alertTypeLabel } from '../../utils/alertLabels.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

/*
 * Alertas pendientes de la página actual (RF-146), en el orden del
 * servidor (la más antigua primero). Solo seudónimo, tipo y fecha: la
 * bandeja no muestra datos personales ni enlaza a fichas individuales.
 */
export function PendingAlertList({ alerts, actionsDisabled = false, onAttend }) {
  return (
    <ol aria-label="Alertas pendientes" className="m-0 flex list-none flex-col gap-[var(--space-3)] p-0">
      {alerts.map((alert) => {
        const typeLabel = alertTypeLabel(alert.type);
        const generatedAt = formatAuditTimestamp(alert.generatedAt);

        return (
          <li
            key={alert.id}
            className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-[var(--space-3)]">
              <span
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--warning-bg)] text-[var(--warning-text)]"
                aria-hidden="true"
              >
                <BellRing size={20} strokeWidth={1.8} />
              </span>

              <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
                <h3 className="m-0 text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]">
                  {typeLabel}
                </h3>

                <p className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                  <UserRound size={14} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
                  <span>
                    Participante{' '}
                    <span className="font-[var(--font-mono)] font-bold text-[var(--text-primary)]">
                      {alert.participantCode}
                    </span>
                  </span>
                </p>

                <p className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
                  <Clock size={14} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
                  <span>
                    Generada:{' '}
                    {generatedAt ? (
                      <time dateTime={alert.generatedAt}>{generatedAt}</time>
                    ) : (
                      'Fecha no disponible'
                    )}
                  </span>
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              disabled={actionsDisabled}
              onClick={() => onAttend(alert)}
              className="min-h-[44px] w-full shrink-0 sm:w-auto"
            >
              <CheckCheck size={16} strokeWidth={1.8} aria-hidden="true" />
              Marcar como atendida
              <span className="sr-only">
                {' '}
                ({typeLabel}, participante {alert.participantCode})
              </span>
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
