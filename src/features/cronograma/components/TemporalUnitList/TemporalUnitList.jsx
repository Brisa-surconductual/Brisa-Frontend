import { TemporalUnitCard } from '@/features/cronograma/components/TemporalUnitCard/index.js';

export function TemporalUnitList({ units = [], onViewDetails }) {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {units.map((unit) => (
        <TemporalUnitCard
          key={unit.idUnidadTemporal}
          unit={unit}
          onViewDetails={() => onViewDetails?.(unit)}
        />
      ))}
    </div>
  );
}