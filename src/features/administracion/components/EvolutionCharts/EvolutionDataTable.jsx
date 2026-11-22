import { ChevronDown } from 'lucide-react';

import { PROGRESS_LEVEL } from '../../types/behavioralAggregate.js';

import {
  COUNT_FORMAT,
  LEVEL_STYLE,
  NO_DATA,
  VALUE_FORMAT,
} from './chartFormat.js';

const LEVELS = Object.values(PROGRESS_LEVEL);

const cell = (value, format) =>
  value === null ? NO_DATA : format.format(value);

const levelUsers = (distribution, level) =>
  distribution?.find((item) => item.level === level)?.users ?? null;

/*
 * Tabla de la serie de RF-141, desplegable con un control nativo
 * (teclado y lectores de pantalla). Muestra los mismos valores originales
 * que los gráficos, por unidad temporal y en el orden del cronograma.
 */
export function EvolutionDataTable({ units }) {
  return (
    <details className="group rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)]">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-lg)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
        Ver los datos de la serie en una tabla
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className="shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>

      <div className="overflow-x-auto overflow-y-hidden px-[var(--space-4)] pb-[var(--space-4)]">
        <table className="w-full min-w-[640px] border-collapse text-left text-[length:var(--font-size-sm)]">
          <caption className="sr-only">
            Evolución de adherencia promedio, distribución de niveles de
            progreso y craving promedio por unidad del cronograma
          </caption>
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
              <th
                scope="col"
                className="py-[var(--space-2)] pr-[var(--space-3)]"
              >
                Unidad
              </th>
              <th
                scope="col"
                className="py-[var(--space-2)] pr-[var(--space-3)]"
              >
                Adherencia promedio
              </th>
              {LEVELS.map((level) => (
                <th
                  key={level}
                  scope="col"
                  className="py-[var(--space-2)] pr-[var(--space-3)]"
                >
                  {LEVEL_STYLE[level].label}
                </th>
              ))}
              <th scope="col" className="py-[var(--space-2)]">
                Craving promedio
              </th>
            </tr>
          </thead>
          <tbody>
            {units.map(({ id, label, adherence, craving, distribution }) => (
              <tr
                key={id}
                className="border-b border-[var(--surface-border)] last:border-0"
              >
                <th
                  scope="row"
                  className="py-[var(--space-2)] pr-[var(--space-3)] font-semibold text-[var(--text-primary)]"
                >
                  {label}
                </th>
                <td className="py-[var(--space-2)] pr-[var(--space-3)] tabular-nums">
                  {cell(adherence, VALUE_FORMAT)}
                </td>
                {LEVELS.map((level) => (
                  <td
                    key={level}
                    className="py-[var(--space-2)] pr-[var(--space-3)] tabular-nums"
                  >
                    {cell(levelUsers(distribution, level), COUNT_FORMAT)}
                  </td>
                ))}
                <td className="py-[var(--space-2)] tabular-nums">
                  {cell(craving, VALUE_FORMAT)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
