import {
  TemporalUnitCard,
} from '@/features/cronograma/components/TemporalUnitCard/index.js';

export function TemporalUnitList({
  units = [],
  onViewDetails,
}) {
  return (
    <div className="grid gap-[var(--space-4)]">
      {units.map(
        ({
          id,
          name,
          status,
          startDate,
          endDate,
          activityCount,
        }) => (
          <TemporalUnitCard
            key={id}
            name={name}
            status={status}
            startDate={startDate}
            endDate={endDate}
            activityCount={activityCount}
            onViewDetails={() =>
              onViewDetails?.(id)
            }
          />
        ),
      )}
    </div>
  );
}