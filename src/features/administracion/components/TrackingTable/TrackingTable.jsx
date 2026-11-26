import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';

import { SORT_DIRECTION, TRACKING_SORT_FIELD } from '../../types/participantTracking.js';
import { alertTypeLabel } from '../../utils/alertLabels.js';
import { NOT_AVAILABLE_LABEL, adherenceLabel, adherencePercent, progressLevelLabel } from '../../utils/trackingLabels.js';

/*
 * Tabla del seguimiento (RF-142) para pantallas anchas; en las estrechas
 * la página muestra las mismas filas como tarjetas (TrackingEntryCard).
 * Solo presenta los campos del contrato ya reducidos por
 * services/trackingResponse.js. Cada encabezado ordenable es un botón:
 * comunica el campo a la página, que pide el nuevo orden al backend
 * (aquí no se ordena nada). `sort` es el orden efectivo, de modo que la
 * columna de código se anuncia ascendente sin orden explícito.
 */
const COLUMNS = Object.freeze([
  Object.freeze({ field: TRACKING_SORT_FIELD.CODE, label: 'Código' }),
  Object.freeze({ field: TRACKING_SORT_FIELD.PROGRESS, label: 'Nivel de progreso' }),
  Object.freeze({ field: TRACKING_SORT_FIELD.ADHERENCE, label: 'Tasa de adherencia' }),
  Object.freeze({ field: TRACKING_SORT_FIELD.ACTIVE_ALERTS, label: 'Alertas activas' }),
  Object.freeze({ field: TRACKING_SORT_FIELD.ATTENDED_ALERTS, label: 'Alertas atendidas' }),
]);

const CELL = 'px-[var(--space-3)] py-[var(--space-3)] align-top';

function ariaSort(sort, field) {
  if (sort.field !== field) return 'none';

  return sort.direction === SORT_DIRECTION.ASC ? 'ascending' : 'descending';
}

function SortIcon({ state }) {
  const Icon = state === 'ascending' ? ArrowUp : state === 'descending' ? ArrowDown : ArrowUpDown;

  return (
    <Icon
      size={14}
      strokeWidth={2}
      aria-hidden="true"
      className={state === 'none' ? 'text-[var(--text-muted)]' : 'text-[var(--brand-600)]'}
    />
  );
}

function activeAlertsText(count) {
  return count === 0 ? 'Ninguna' : String(count);
}

export function TrackingTable({ rows, sort, onSort }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]">
      <table className="w-full border-collapse text-left text-[length:var(--font-size-sm)]">
        <caption className="sr-only">
          Indicadores de seguimiento por participante. Los encabezados de
          columna permiten cambiar el orden.
        </caption>
        <thead>
          <tr className="border-b border-[var(--surface-border)] text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
            {COLUMNS.map(({ field, label }) => {
              const state = ariaSort(sort, field);

              return (
                <th key={field} scope="col" aria-sort={state} className="px-[var(--space-1)] py-[var(--space-1)] font-bold">
                  <button
                    type="button"
                    onClick={() => onSort(field)}
                    className="inline-flex min-h-[44px] items-center gap-[var(--space-1)] rounded-[var(--radius-md)] px-[var(--space-2)] text-left font-bold text-inherit transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
                  >
                    {label}
                    <SortIcon state={state} />
                  </button>
                </th>
              );
            })}
            <th scope="col" className="px-[var(--space-3)] py-[var(--space-1)] font-bold">
              <span className="sr-only">Ficha individual</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ entry, detailPath }) => {
            const percent = adherencePercent(entry.adherence);

            return (
              <tr key={entry.code} className="border-b border-[var(--surface-border)] last:border-0">
                <th scope="row" className={`${CELL} font-bold text-[var(--text-primary)]`}>
                  <span className="font-[family-name:var(--font-mono)]">{entry.code}</span>
                </th>
                <td className={`${CELL} ${entry.progressLevel === null ? 'text-[var(--text-secondary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
                  {progressLevelLabel(entry.progressLevel)}
                </td>
                <td className={CELL}>
                  <span className={`block font-semibold tabular-nums ${percent === null ? 'font-normal text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                    {adherenceLabel(entry.adherence)}
                  </span>
                  {percent !== null && (
                    <span aria-hidden="true" className="mt-[var(--space-1)] block h-[6px] w-[96px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-hover)]">
                      <span className="block h-full rounded-[var(--radius-full)] bg-[var(--brand-500)]" style={{ width: `${percent}%` }} />
                    </span>
                  )}
                </td>
                <td className={CELL}>
                  <span className={`block tabular-nums ${entry.activeAlertCount === 0 ? 'text-[var(--text-secondary)]' : 'font-bold text-[var(--warning-text)]'}`}>
                    {activeAlertsText(entry.activeAlertCount)}
                  </span>
                  {entry.activeAlertTypes.length > 0 && (
                    <span className="block text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
                      {entry.activeAlertTypes.map(alertTypeLabel).join(' · ')}
                    </span>
                  )}
                </td>
                <td className={`${CELL} tabular-nums text-[var(--text-primary)]`}>{entry.attendedAlertCount}</td>
                <td className={`${CELL} text-right`}>
                  {detailPath ? (
                    <Link
                      to={detailPath}
                      className="inline-flex min-h-[44px] items-center gap-[var(--space-1)] rounded-[var(--radius-md)] px-[var(--space-2)] font-bold whitespace-nowrap text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
                    >
                      Ver ficha
                      <span className="sr-only"> de {entry.code}</span>
                      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                    </Link>
                  ) : (
                    <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
                      Ficha {NOT_AVAILABLE_LABEL.toLowerCase()}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
