import { useEffect, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import {
  getCohortEvolution,
  getEvolutionSourceMode,
  getScheduleUnits,
} from '../../../data/cohortEvolutionSource.js';
import { withTimeout } from '../../../services/cohortDashboard.js';
import {
  evolutionStatusFromError,
  interpretCohortEvolution,
} from '../../../services/cohortEvolutionResponse.js';
import { AGGREGATE_SOURCE_MODE } from '../../../types/behavioralAggregate.js';
import {
  EVOLUTION_MIN_UNITS,
  EVOLUTION_QUERY_TIMEOUT_MS,
} from '../../../types/cohortEvolution.js';

const DEFAULT_SOURCE = Object.freeze({
  getMode: getEvolutionSourceMode,
  getCohort,
  getUnits: getScheduleUnits,
  getEvolution: getCohortEvolution,
});

export function useCohortEvolution({
  cohortId,
  filters = null,
  source = DEFAULT_SOURCE,
  timeoutMs = EVOLUTION_QUERY_TIMEOUT_MS,
} = {}) {
  const [mode] = useState(() => source.getMode());
  const [cohort, setCohort] = useState(null);
  const [view, setView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    // El detalle identifica la cohorte de la cabecera y su cronograma.
    const cohortRequest = withTimeout(
      Promise.resolve().then(() => source.getCohort(cohortId)),
      timeoutMs,
    ).then((value) => (value?.id === cohortId ? value : null));
    void cohortRequest.then(
      (value) => {
        if (active) setCohort(value);
      },
      () => {
        if (active) setCohort(null);
      },
    );

    async function load() {
      setIsLoading(true);
      setView(null);

      try {
        const response = await withTimeout(
          Promise.resolve().then(() =>
            source.getEvolution(cohortId, { filters }),
          ),
          timeoutMs,
        );
        const ids = response?.serie_unidades_temporales;
        let catalog = [];
        // El catálogo solo es necesario cuando se van a presentar las unidades.
        if (active && Array.isArray(ids) && ids.length >= EVOLUTION_MIN_UNITS) {
          const currentCohort = await cohortRequest;
          if (!active) return;
          catalog = await withTimeout(
            source.getUnits(cohortId, currentCohort),
            timeoutMs,
          );
        }
        if (active) {
          setView(interpretCohortEvolution(response, catalog, cohortId));
        }
      } catch (error) {
        if (active) {
          setView({ status: evolutionStatusFromError(error), units: [] });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [attempt, cohortId, filters, source, timeoutMs]);

  return {
    cohort,
    view,
    isLoading,
    isDemo: mode === AGGREGATE_SOURCE_MODE.DEMO,
    retry: () => setAttempt((value) => value + 1),
  };
}
