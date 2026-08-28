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
      className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] md:p-[var(--space-5)]"
      aria-labelledby="schedule-filters-title"
    >
      <div className="flex flex-col gap-[var(--space-4)]">
        <div>
          <h2
            id="schedule-filters-title"
            className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
          >
            Filtros
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] text-[var(--text-muted)]">
            Consulta las unidades del
            cronograma por estado o fecha.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
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

        <p
          className="m-0 text-[12px] font-semibold text-[var(--text-secondary)]"
          aria-live="polite"
        >
          {resultCount} de {totalCount}{' '}
          unidades
        </p>
      </div>
    </section>
  );
}