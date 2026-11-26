import { getNotificationAggregateFromApi } from '../api/vistasAgregadasApi.js';
import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

export function getNotificationAggregateSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.API;
}

export async function getNotificationAggregate(cohortId) {
  if (import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true') {
    const demo = await import('./notificationAggregateDemoSource.js');
    return demo.getNotificationAggregate(cohortId);
  }
  return getNotificationAggregateFromApi(cohortId);
}
