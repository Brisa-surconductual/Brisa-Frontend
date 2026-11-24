import { getBehavioralAggregateFromApi } from '../api/vistaAgregadaConductualApi.js';
import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

export function getAggregateSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.API;
}

export async function getBehavioralAggregate(cohortId) {
  if (import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true') {
    return (await import('./behavioralAggregateDemoSource.js')).getBehavioralAggregate(cohortId);
  }
  return getBehavioralAggregateFromApi(cohortId);
}
