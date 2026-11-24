import { listScheduleUnits } from '../api/cohortesApi.js';
import { getCohortEvolutionFromApi } from '../api/vistasAgregadasApi.js';
import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Único punto que carga la demostración de la evolución temporal. El
 * import dinámico está dentro de la condición del M08: en producción la
 * rama se elimina y ningún dato ficticio llega al build.
 */
async function loadEvolutionDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error('La demostración de evolución temporal está desactivada.');
  }

  return import('./cohortEvolutionDemoSource.js');
}

export function getEvolutionSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.API;
}

export async function getScheduleUnits(cohortId, cohort) {
  if (isCohortDemoEnabled()) {
    return (await loadEvolutionDemoSource()).getScheduleUnits(cohortId);
  }

  if (cohort?.id !== cohortId || !cohort.scheduleId) {
    throw new Error('No se pudo identificar el cronograma de la cohorte.');
  }

  return listScheduleUnits(cohort.scheduleId);
}

export async function getCohortEvolution(cohortId, { filters = null } = {}) {
  if (isCohortDemoEnabled()) {
    return (await loadEvolutionDemoSource()).getCohortEvolution(cohortId, {
      filters,
    });
  }
  if (filters && Object.keys(filters).length > 0) {
    throw new Error(
      'Los filtros de evolución temporal aún no están disponibles.',
    );
  }
  return getCohortEvolutionFromApi(cohortId);
}
