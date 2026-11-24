import {
  getAggregateSourceMode,
  getBehavioralAggregate,
} from '../../../data/behavioralAggregateSource.js';
import { getCohort } from '../../../data/cohortSource.js';
import { interpretBehavioralAggregate } from '../../../services/behavioralAggregateResponse.js';
import { useCohortAggregateView } from '../../../hooks/useCohortAggregateView.js';

const DEFAULT_SOURCE = Object.freeze({
  getMode: getAggregateSourceMode,
  getCohort,
  getAggregate: getBehavioralAggregate,
});

export function useCohortAggregate({ cohortId, source = DEFAULT_SOURCE } = {}) {
  return useCohortAggregateView(cohortId, source, interpretBehavioralAggregate);
}
