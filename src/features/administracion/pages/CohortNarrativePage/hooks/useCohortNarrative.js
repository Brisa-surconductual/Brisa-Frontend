import { useEffect, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import {
  getNarrativeAggregate,
  getNarrativeSourceMode,
} from '../../../data/narrativeAggregateSource.js';
import {
  aggregateStatusFromError,
  interpretNarrativeAggregate,
} from '../../../services/narrativeAggregateResponse.js';
import { AGGREGATE_SOURCE_MODE } from '../../../types/behavioralAggregate.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getNarrativeSourceMode,
  getCohort,
  getAggregate: getNarrativeAggregate,
});

/*
 * Vista agregada de progresión narrativa de una cohorte (RF-133), solo
 * consulta. Pide la vista a su propia fuente y la interpreta
 * (services/narrativeAggregateResponse.js): solo muestra datos de la
 * cohorte pedida y nunca los recalcula. Es independiente de las demás
 * vistas agregadas: no espera a RF-132 ni a RF-134, y el nombre de la
 * cohorte se pide por separado, de modo que si falla no bloquea la
 * vista. Un fallo nunca deja datos visibles ni se reemplaza por datos
 * ficticios. La página se monta de nuevo al cambiar de cohorte (key).
 * `source` permite sustituir la fuente sin cambiar la página.
 */
export function useCohortNarrative({ cohortId, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending =
    mode === AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION;

  const [cohort, setCohort] = useState(null);
  const [view, setView] = useState(null);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [attempt, setAttempt] = useState(0);

  // Nombre de la cohorte para identificarla (no son datos de participantes).
  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    source.getCohort(cohortId).then(
      (value) => {
        if (active) setCohort(value?.id === cohortId ? value : null);
      },
      () => {
        if (active) setCohort(null);
      },
    );

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isIntegrationPending, source]);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    async function load() {
      setIsLoading(true);
      setView(null);

      try {
        const interpreted = interpretNarrativeAggregate(
          await source.getAggregate(cohortId),
          cohortId,
        );
        if (active) setView(interpreted);
      } catch (error) {
        if (active)
          setView({ status: aggregateStatusFromError(error), data: null });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isIntegrationPending, source]);

  return {
    cohort,
    view,
    isLoading,
    isDemo: mode === AGGREGATE_SOURCE_MODE.DEMO,
    isIntegrationPending,
    retry: () => setAttempt((value) => value + 1),
  };
}
