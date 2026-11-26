import { SlidersHorizontal } from 'lucide-react';

import { SelectField } from '@/shared/components/ui/SelectField/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import {
  TEMPORAL_UNIT_STATUS,
  TEMPORAL_UNIT_STATUS_LABEL,
} from '@/features/cronograma/types/scheduleTypes.js';

const STATUS_OPTIONS = Object.freeze(
  Object.values(TEMPORAL_UNIT_STATUS).map(
    (status) =>
      Object.freeze({
        value: status,
        label:
          TEMPORAL_UNIT_STATUS_LABEL[
            status
          ],
      }),
  ),
);

/*
 * Filtros de unidades del panel: estado y fecha. Mismos campos y
 * callbacks; solo cambia la presentación.
 */
export function ScheduleFilters({
  status = '',
  date = '',
  resultCount = 0,
  totalCount = 0,
  onStatusChange,
  onDateChange,
}) {
  return (
    <section
      className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
      aria-labelledby="schedule-filters-title"
    >
      <div className="flex flex-col gap-[var(--space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
          <h2
            id="schedule-filters-title"
            className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]"
          >
            <SlidersHorizontal
              size={18}
              strokeWidth={1.8}
              className="text-[var(--brand-600)]"
              aria-hidden="true"
            />
            Filtrar unidades
          </h2>

          <p
            className="m-0 rounded-[var(--radius-full)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[2px] text-[length:var(--font-size-xs)] font-bold text-[var(--text-secondary)] tabular-nums"
            aria-live="polite"
          >
            {resultCount} de {totalCount}{' '}
            unidades
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
          <SelectField
            id="schedule-status"
            name="status"
            label="Estado"
            placeholder="Todos los estados"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) =>
              onStatusChange?.(
                event.target.value,
              )
            }
          />

          <TextField
            id="schedule-date"
            name="date"
            type="date"
            label="Fecha"
            value={date}
            onChange={(event) =>
              onDateChange?.(
                event.target.value,
              )
            }
          />
        </div>
      </div>
    </section>
  );
}
