import { TemporalUnitCard } from '@/features/cronograma/components/TemporalUnitCard/index.js';

export function TemporalUnitList({ units = [], onViewDetails }) {
  return (
    <div className="grid gap-[var(--space-4)]">
      {units.map((unit) => (
        <TemporalUnitCard
          key={unit.id}
          name={unit.name}
          status={unit.status}
          startDate={unit.startDate}
          endDate={unit.endDate}
          activityCount={unit.activityCount}
          onViewDetails={() => onViewDetails?.(unit)}
        />
      ))}
    </div>
  );
}
