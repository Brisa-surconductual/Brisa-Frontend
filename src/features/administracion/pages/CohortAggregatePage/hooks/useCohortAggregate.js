import { useEffect, useState } from 'react';

import {
  getAggregateSourceMode,
  getBehavioralAggregate,
} from '../../../data/behavioralAggregateSource.js';
import { getCohort } from '../../../data/cohortSource.js';
import {
  aggregateStatusFromError,
  interpretBehavioralAggregate,
} from '../../../services/behavioralAggregateResponse.js';
import { AGGREGATE_SOURCE_MODE, AGGREGATE_VIEW_STATUS } from '../../../types/behavioralAggregate.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getAggregateSourceMode,
  getCohort,
  getAggregate: getBehavioralAggregate,
});

/*
 * Vista agregada conductual de una cohorte (RF-132), solo consulta. Pide
 * la vista a la fuente y la interpreta (services/behavioralAggregateResponse.js):
 * solo muestra datos de la cohorte pedida y nunca los recalcula. Un fallo
 * nunca deja datos visibles ni se reemplaza por datos ficticios. La
 * página se monta de nuevo al cambiar de cohorte (key), así que la vista
 * de otra cohorte nunca queda en pantalla. `source` permite sustituir la
 * fuente sin cambiar la página.
 */
export function useCohortAggregate({ cohortId, source = DEFAULT_SOURCE } = {}) {
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
        const interpreted = interpretBehavioralAggregate(
          await source.getAggregate(cohortId),
          cohortId,
        );
        if (active) setView(interpreted);
      } catch (error) {
        if (active) {
          const status = aggregateStatusFromError(error);
          const message = status === AGGREGATE_VIEW_STATUS.NOT_FOUND ? error?.mensaje : null;
          setView({ status, data: null, ...(message && { message }) });
        }
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
