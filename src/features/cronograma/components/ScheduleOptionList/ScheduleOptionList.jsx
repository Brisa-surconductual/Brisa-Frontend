import { Circle, CircleCheck } from 'lucide-react';

import { ScheduleStatusBadge } from '../ScheduleStatusBadge/index.js';

/*
 * Selección de un cronograma con radios nativos: teclado (Tab y
 * flechas) y lector de pantalla sin código extra. La selección se
 * indica con ícono, texto y borde, no solo con color.
 */
export function ScheduleOptionList({
  schedules,
  selectedId,
  onSelect,
  name = 'assign-schedule',
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Cronograma a asignar</legend>

      <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
        {schedules.map((schedule, index) => {
          const scheduleId = schedule.idCronograma;
          const isSelected = selectedId === scheduleId;
          const inputId = `${name}-${index}`;
          const Indicator = isSelected ? CircleCheck : Circle;

          return (
            <label
              key={scheduleId}
              htmlFor={inputId}
              className={`flex min-h-[64px] cursor-pointer items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[1.5px] p-[var(--space-4)] transition-[border-color,background-color] duration-150 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--brand-500)] motion-reduce:transition-none ${
                isSelected
                  ? 'border-[var(--brand-500)] bg-[var(--brand-50)]'
                  : 'border-[var(--surface-border)] bg-[var(--surface-card)] hover:border-[var(--brand-300)]'
              }`}
            >
              <input
                type="radio"
                id={inputId}
                name={name}
                value={scheduleId}
                checked={isSelected}
                onChange={() => onSelect(scheduleId)}
                className="sr-only"
              />

              <Indicator
                size={22}
                strokeWidth={1.8}
                className={`mt-[1px] shrink-0 ${
                  isSelected
                    ? 'text-[var(--brand-600)]'
                    : 'text-[var(--text-muted)]'
                }`}
                aria-hidden="true"
              />

              <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
                <span className="text-[length:var(--font-size-md)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                  {schedule.nombreCronograma || 'Cronograma'}
                </span>

                <span className="flex flex-wrap items-center gap-[var(--space-2)]">
                  <ScheduleStatusBadge status={schedule.estado} />

                  {schedule.esBase && (
                    <span className="text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]">
                      Cronograma base
                    </span>
                  )}

                  {isSelected && (
                    <span className="text-[length:var(--font-size-xs)] font-bold text-[var(--brand-700)]">
                      Seleccionado
                    </span>
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
