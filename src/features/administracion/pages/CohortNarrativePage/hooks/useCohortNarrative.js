import { getCohort } from '../../../data/cohortSource.js';
import {
  getNarrativeAggregate,
  getNarrativeSourceMode,
} from '../../../data/narrativeAggregateSource.js';
import { interpretNarrativeAggregate } from '../../../services/narrativeAggregateResponse.js';
import { useCohortAggregateView } from '../../../hooks/useCohortAggregateView.js';

const DEFAULT_SOURCE = Object.freeze({
  getMode: getNarrativeSourceMode,
  getCohort,
  getAggregate: getNarrativeAggregate,
});

export function useCohortNarrative({ cohortId, source = DEFAULT_SOURCE } = {}) {
  return useCohortAggregateView(cohortId, source, interpretNarrativeAggregate);
}
