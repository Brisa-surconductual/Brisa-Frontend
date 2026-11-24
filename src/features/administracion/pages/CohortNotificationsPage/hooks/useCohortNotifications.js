import { getCohort } from '../../../data/cohortSource.js';
import {
  getNotificationAggregate,
  getNotificationAggregateSourceMode,
} from '../../../data/notificationAggregateSource.js';
import { interpretNotificationAggregate } from '../../../services/notificationAggregateResponse.js';
import { useCohortAggregateView } from '../../../hooks/useCohortAggregateView.js';

const DEFAULT_SOURCE = Object.freeze({
  getMode: getNotificationAggregateSourceMode,
  getCohort,
  getAggregate: getNotificationAggregate,
});

export function useCohortNotifications({ cohortId, source = DEFAULT_SOURCE } = {}) {
  return useCohortAggregateView(cohortId, source, interpretNotificationAggregate);
}
