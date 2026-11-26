import { ParticipantProgressCard } from '@/features/cronograma/components/ParticipantProgressCard/index.js';

export function ParticipantProgressList({
  participants,
  onViewTemporalInformation,
}) {
  return (
    <section
      aria-labelledby="participant-progress-list-title"
      className="flex flex-col gap-[var(--space-4)]"
    >
      <div className="flex items-baseline justify-between gap-[var(--space-3)]">
        <h2
          id="participant-progress-list-title"
          className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
        >
          Ubicación temporal
        </h2>

        <p className="m-0 text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)] tabular-nums">
          {participants.length}{' '}
          {participants.length === 1 ? 'participante' : 'participantes'}
        </p>
      </div>

      <ul className="m-0 grid list-none gap-[var(--space-3)] p-0">
        {participants.map((participant) => (
          <li key={participant.id}>
            <ParticipantProgressCard
              participantName={participant.participantName}
              temporalUnitName={participant.temporalUnitName}
              currentWeek={participant.currentWeek}
              currentDay={participant.currentDay}
              status={participant.status}
              onViewTemporalInformation={
                onViewTemporalInformation
                  ? () => onViewTemporalInformation(participant)
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
