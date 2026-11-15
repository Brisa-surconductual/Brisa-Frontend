import { PARTICIPATION_STATUS } from '../types/participantStatus.js';

/*
 * Cuántos participantes informa la fuente en cada estado de
 * participación (RF-125). Solo cuenta: no deduce ni corrige estados.
 */
export function countParticipantsByStatus(participants) {
  const counts = Object.fromEntries(
    Object.values(PARTICIPATION_STATUS).map((status) => [status, 0]),
  );

  for (const { participationStatus } of participants) {
    if (participationStatus in counts) counts[participationStatus] += 1;
  }

  return counts;
}
