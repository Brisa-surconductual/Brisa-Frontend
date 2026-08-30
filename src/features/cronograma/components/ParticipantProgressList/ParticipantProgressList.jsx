import { ParticipantProgressCard } from '@/features/cronograma/components/ParticipantProgressCard/index.js';

export function ParticipantProgressList({ participants }) {
  return (
    <section aria-labelledby="participant-progress-list-title">
      <h2
        id="participant-progress-list-title"
        className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
      >
        Ubicación temporal
      </h2>

      <div className="mt-[var(--space-3)] grid gap-[var(--space-4)]">
        {participants.map((participant) => (
          <ParticipantProgressCard
            key={participant.id}
            participantName={participant.participantName}
            temporalUnitName={participant.temporalUnitName}
            currentWeek={participant.currentWeek}
            currentDay={participant.currentDay}
            status={participant.status}
          />
        ))}
      </div>
    </section>
  );
}
