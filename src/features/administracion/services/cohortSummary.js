import { COHORT_STATUS } from '../types/cohortStatus.js';

// Cuántas cohortes hay en cada estado conocido (RF-124).
export function countCohortsByStatus(cohorts) {
  const counts = Object.fromEntries(
    Object.values(COHORT_STATUS).map((status) => [status, 0]),
  );

  for (const { status } of cohorts) {
    if (status in counts) counts[status] += 1;
  }

  return counts;
}
