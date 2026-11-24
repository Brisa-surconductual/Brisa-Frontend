import { useEffect, useState } from 'react';

import { aggregateViewFromError } from '../services/aggregateViewEnvelope.js';
import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';

// La consulta de métricas no depende de la carga del nombre de la cohorte.
export function useCohortAggregateView(cohortId, source, interpret) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending =
    mode === AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION;

  const [cohort, setCohort] = useState(null);
  const [view, setView] = useState(null);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isIntegrationPending) return undefined;
    let active = true;

    function updateCohort(value) {
      if (active) setCohort(value?.id === cohortId ? value : null);
    }

    async function loadAggregate() {
      setIsLoading(true);
      setView(null);

      let nextView;
      try {
        nextView = interpret(await source.getAggregate(cohortId), cohortId);
      } catch (error) {
        nextView = aggregateViewFromError(error);
      }

      if (active) {
        setView(nextView);
        setIsLoading(false);
      }
    }

    void source.getCohort(cohortId).then(updateCohort, () => updateCohort(null));
    void loadAggregate();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, interpret, isIntegrationPending, source]);

  return {
    cohort,
    view,
    isLoading,
    isDemo: mode === AGGREGATE_SOURCE_MODE.DEMO,
    isIntegrationPending,
    retry: () => setAttempt((value) => value + 1),
  };
}
