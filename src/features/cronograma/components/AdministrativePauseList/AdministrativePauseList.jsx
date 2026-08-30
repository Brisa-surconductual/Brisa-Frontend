import { AdministrativePauseCard } from '@/features/cronograma/components/AdministrativePauseCard/index.js';

export function AdministrativePauseList({ pauses, onAnnul }) {
  return (
    <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
      {pauses.map((pause) => (
        <AdministrativePauseCard
          key={pause.id}
          participantName={pause.participantName}
          startDate={pause.startDate}
          endDate={pause.endDate}
          reason={pause.reason}
          status={pause.status}
          canAnnul={pause.canAnnul}
          onAnnul={() => onAnnul?.(pause)}
        />
      ))}
    </div>
  );
}
