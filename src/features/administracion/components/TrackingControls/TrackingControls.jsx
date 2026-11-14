import { useId } from 'react';
import { FilterX } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { SelectField } from '@/shared/components/ui/SelectField/index.js';

import {
  SORT_DIRECTION,
  TRACKING_ALERT_FILTER,
  TRACKING_SORT_FIELD,
  TRACKING_THRESHOLDS,
} from '../../types/participantTracking.js';

/*
 * Filtros y orden del seguimiento (RF-142). Solo presenta: cada cambio
 * se comunica al hook, que lo pide a la fuente; aquí no se filtra ni se
 * ordena nada. La opción vacía de cada selector significa «sin filtro»
 * u «orden de la fuente».
 */
const THRESHOLD_OPTIONS = Object.freeze(
  TRACKING_THRESHOLDS.map((value) => Object.freeze({ value: String(value), label: `${value} % o más` })),
);

const ALERT_OPTIONS = Object.freeze([
  Object.freeze({ value: TRACKING_ALERT_FILTER.WITH_ALERTS, label: 'Con alertas activas' }),
  Object.freeze({ value: TRACKING_ALERT_FILTER.WITHOUT_ALERTS, label: 'Sin alertas activas' }),
]);

const sortOption = (field, direction, label) => Object.freeze({ value: `${field}-${direction}`, label });

const SORT_OPTIONS = Object.freeze([
  sortOption(TRACKING_SORT_FIELD.PROGRESS, SORT_DIRECTION.DESC, 'Progreso: de mayor a menor'),
  sortOption(TRACKING_SORT_FIELD.PROGRESS, SORT_DIRECTION.ASC, 'Progreso: de menor a mayor'),
  sortOption(TRACKING_SORT_FIELD.ADHERENCE, SORT_DIRECTION.DESC, 'Adherencia: de mayor a menor'),
  sortOption(TRACKING_SORT_FIELD.ADHERENCE, SORT_DIRECTION.ASC, 'Adherencia: de menor a mayor'),
  sortOption(TRACKING_SORT_FIELD.ACTIVE_ALERTS, SORT_DIRECTION.DESC, 'Alertas activas: de más a menos'),
  sortOption(TRACKING_SORT_FIELD.ACTIVE_ALERTS, SORT_DIRECTION.ASC, 'Alertas activas: de menos a más'),
]);

const valueOf = (value) => (value === null || value === undefined ? '' : String(value));

export function TrackingControls({ filters, sortValue, hasFilters, disabled = false, onFilter, onSort, onClearFilters }) {
  const baseId = useId();

  return (
    <form
      role="search"
      aria-label="Filtrar y ordenar participantes"
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] md:p-[var(--space-5)]"
    >
      <div className="grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          id={`${baseId}-progreso`}
          label="Nivel de progreso"
          placeholder="Cualquier progreso"
          options={THRESHOLD_OPTIONS}
          value={valueOf(filters.progressMin)}
          disabled={disabled}
          onChange={(event) => onFilter('progressMin', event.target.value)}
        />
        <SelectField
          id={`${baseId}-adherencia`}
          label="Tasa de adherencia"
          placeholder="Cualquier adherencia"
          options={THRESHOLD_OPTIONS}
          value={valueOf(filters.adherenceMin)}
          disabled={disabled}
          onChange={(event) => onFilter('adherenceMin', event.target.value)}
        />
        <SelectField
          id={`${baseId}-alertas`}
          label="Alertas activas"
          placeholder="Todas"
          options={ALERT_OPTIONS}
          value={valueOf(filters.alerts)}
          disabled={disabled}
          onChange={(event) => onFilter('alerts', event.target.value)}
        />
        <SelectField
          id={`${baseId}-orden`}
          label="Ordenar por"
          placeholder="Orden de la fuente"
          options={SORT_OPTIONS}
          value={sortValue}
          disabled={disabled}
          onChange={(event) => onSort(event.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="secondary" onClick={onClearFilters} disabled={disabled} className="min-h-[44px] w-full sm:w-fit">
          <FilterX size={16} strokeWidth={1.8} aria-hidden="true" />
          Limpiar filtros
        </Button>
      )}
    </form>
  );
}
