import {
  CalendarClock,
  CircleCheck,
  CircleDot,
  Hourglass,
  Info,
  Layers,
  ListOrdered,
} from 'lucide-react';

import { PanelNotice } from '../PanelNotice/index.js';
import { StatusChip } from '../StatusChip/index.js';

function formatValue(value) {
  return value ?? '—';
}

/*
 * Resumen temporal del participante. Muestra los valores ya
 * transformados por la página; no calcula progreso propio.
 */
export function TemporalInformationSummary({
  participantName,
  temporalUnitName,
  temporalUnitOrder,
  calculationDateText,
  elapsedTimeText,
  completed = false,
  message,
}) {
  const items = [
    { label: 'Unidad temporal', value: temporalUnitName, Icon: Layers },
    { label: 'Orden de unidad', value: temporalUnitOrder, Icon: ListOrdered },
    { label: 'Fecha de cálculo', value: calculationDateText, Icon: CalendarClock },
    { label: 'Tiempo efectivo', value: elapsedTimeText, Icon: Hourglass },
  ];

  return (
    <section
      aria-labelledby="temporal-information-summary-title"
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] sm:p-[var(--space-5)] md:p-[var(--space-6)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div className="min-w-0">
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
            Participante
          </p>

          <h2
            id="temporal-information-summary-title"
            className="mt-[2px] mb-0 text-[length:var(--font-size-xl)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]"
          >
            {formatValue(participantName)}
          </h2>
        </div>

        {completed ? (
          <StatusChip tone="success" icon={CircleCheck}>
            Completado
          </StatusChip>
        ) : (
          <StatusChip tone="brand" icon={CircleDot}>
            En curso
          </StatusChip>
        )}
      </div>

      <dl className="m-0 grid gap-[var(--space-3)] sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-[var(--space-3)]"
          >
            <Icon
              size={18}
              strokeWidth={1.8}
              className="mt-[2px] shrink-0 text-[var(--brand-600)]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-[length:var(--font-size-xs)] font-semibold text-[var(--text-muted)]">
                {label}
              </dt>
              <dd className="m-0 mt-[2px] text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)] tabular-nums">
                {formatValue(value)}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {message ? (
        <PanelNotice tone="info" icon={Info} role="status">
          {message}
        </PanelNotice>
      ) : null}
    </section>
  );
}
