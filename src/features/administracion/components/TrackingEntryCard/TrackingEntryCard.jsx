import { Link } from 'react-router-dom';
import { BellRing, CheckCheck, ChevronRight, CircleCheck } from 'lucide-react';

import { alertTypeLabel } from '../../utils/alertLabels.js';
import { NOT_AVAILABLE_LABEL, adherenceLabel, adherencePercent, progressLevelLabel } from '../../utils/trackingLabels.js';

/*
 * Indicadores de seguimiento de un participante (RF-142), solo consulta.
 * Recibe un registro ya reducido a los campos del contrato
 * (services/trackingResponse.js) y muestra EXCLUSIVAMENTE el código
 * seudonimizado, el nivel de progreso (categoría), la tasa de adherencia
 * (en %), las alertas activas con sus tipos y las alertas atendidas. Un
 * indicador sin dato se muestra como no disponible, nunca como 0. Con
 * `detailPath` enlaza a la ficha individual (RF-128).
 */
function ProgressIndicator({ level }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
      <dt className="text-[var(--text-secondary)]">Nivel de progreso</dt>
      <dd className={`m-0 font-bold ${level === null ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
        {progressLevelLabel(level)}
      </dd>
    </div>
  );
}

function AdherenceIndicator({ value }) {
  const percent = adherencePercent(value);

  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <dt className="text-[var(--text-secondary)]">Tasa de adherencia</dt>
      <dd className="m-0 flex flex-col gap-[var(--space-1)]">
        <span className={`font-bold tabular-nums ${percent === null ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
          {adherenceLabel(value)}
        </span>
        {percent !== null && (
          <span aria-hidden="true" className="block h-[6px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]">
            <span className="block h-full rounded-[var(--radius-full)] bg-[var(--brand-500)]" style={{ width: `${percent}%` }} />
          </span>
        )}
      </dd>
    </div>
  );
}

function activeLabel(count) {
  if (count === 0) return 'Sin alertas activas';

  return `${count} ${count === 1 ? 'alerta activa' : 'alertas activas'}`;
}

function AlertsIndicator({ active, attended, types }) {
  const Icon = active === 0 ? CircleCheck : BellRing;
  const tone = active === 0
    ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
    : 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]';

  return (
    <>
      <div className="flex flex-col gap-[var(--space-1)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
          <dt className="text-[var(--text-secondary)]">Alertas activas</dt>
          <dd className="m-0">
            <span className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold ${tone}`}>
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              {activeLabel(active)}
            </span>
          </dd>
        </div>
        {types.length > 0 && (
          <p className="m-0 text-right text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
            {types.map(alertTypeLabel).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
        <dt className="text-[var(--text-secondary)]">Alertas atendidas</dt>
        <dd className="m-0 inline-flex items-center gap-[var(--space-1)] font-bold text-[var(--text-primary)] tabular-nums">
          <CheckCheck size={14} strokeWidth={2} aria-hidden="true" className="text-[var(--text-muted)]" />
          {attended}
        </dd>
      </div>
    </>
  );
}

export function TrackingEntryCard({ entry, detailPath = null }) {
  return (
    <article className="flex h-full flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <h3 className="m-0 text-[length:var(--font-size-lg)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
        <span className="sr-only">Participante </span>
        <span className="font-[family-name:var(--font-mono)]">{entry.code}</span>
      </h3>

      <dl className="m-0 flex flex-col gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
        <ProgressIndicator level={entry.progressLevel} />
        <AdherenceIndicator value={entry.adherence} />
        <AlertsIndicator active={entry.activeAlertCount} attended={entry.attendedAlertCount} types={entry.activeAlertTypes} />
      </dl>

      {detailPath ? (
        <div className="mt-auto border-t border-[var(--surface-border)] pt-[var(--space-3)]">
          <Link
            to={detailPath}
            className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
          >
            Ver ficha
            <span className="sr-only"> de {entry.code}</span>
            <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <p className="mt-auto mb-0 border-t border-[var(--surface-border)] pt-[var(--space-3)] text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
          Ficha {NOT_AVAILABLE_LABEL.toLowerCase()}: el código no tiene el formato esperado.
        </p>
      )}
    </article>
  );
}
