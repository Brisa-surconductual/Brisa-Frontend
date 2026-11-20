import {
  CircleHelp,
  Clock,
  FileDown,
  LogIn,
  SlidersHorizontal,
  UserSearch,
} from 'lucide-react';

import { AUDIT_ACTION } from '../../types/auditAction.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { AuditStatusBadge } from '../AuditStatusBadge/index.js';

/*
 * Registro de la bitácora (RF-123). Muestra EXCLUSIVAMENTE fecha y
 * hora, acción, recurso afectado y estado: recibe un registro ya
 * reducido a los campos permitidos (services/auditEntry.js) y no lee
 * ningún otro. El identificador solo sirve de clave en la lista. Es de
 * solo lectura: no ofrece editar, eliminar ni exportar.
 */
const ACTION_PRESENTATION = Object.freeze({
  [AUDIT_ACTION.MODULE_ACCESS]: Object.freeze({ label: 'Acceso al módulo', Icon: LogIn }),
  [AUDIT_ACTION.PARTICIPANT_QUERY]: Object.freeze({ label: 'Consulta de participante', Icon: UserSearch }),
  [AUDIT_ACTION.DATA_EXPORT]: Object.freeze({ label: 'Exportación de datos', Icon: FileDown }),
  [AUDIT_ACTION.THRESHOLD_CONFIGURATION]: Object.freeze({ label: 'Configuración de umbrales', Icon: SlidersHorizontal }),
});

const TIME_ZONE_LABEL = 'hora de Colombia';

export function AuditEntryCard({ entry }) {
  const known = ACTION_PRESENTATION[entry.action];
  const ActionIcon = known?.Icon ?? CircleHelp;
  const formatted = formatAuditTimestamp(entry.timestamp);

  return (
    <article className="grid grid-cols-1 gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] md:items-center md:gap-[var(--space-5)] md:py-[var(--space-3)]">
      <p className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
        <Clock size={16} strokeWidth={1.8} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        {formatted ? (
          <time dateTime={entry.timestamp}>
            {formatted}
            <span className="sr-only"> ({TIME_ZONE_LABEL})</span>
          </time>
        ) : (
          'Fecha y hora no disponibles'
        )}
      </p>

      <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
        <h3 className="m-0 inline-flex min-w-0 items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
          <ActionIcon size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
          {known ? (
            known.label
          ) : (
            <span className="min-w-0 [overflow-wrap:anywhere]">
              Acción no clasificada
              {entry.action && ' '}
              {entry.action && (
                <span className="ml-[var(--space-1)] font-[family-name:var(--font-mono)] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-muted)]">
                  {entry.action}
                </span>
              )}
            </span>
          )}
        </h3>

        <p className="m-0 text-[length:var(--font-size-sm)] [overflow-wrap:anywhere] text-[var(--text-secondary)]">
          <span className="sr-only">Recurso afectado: </span>
          {entry.resource.trim() || 'Recurso no especificado'}
        </p>
      </div>

      <AuditStatusBadge status={entry.status} />
    </article>
  );
}
