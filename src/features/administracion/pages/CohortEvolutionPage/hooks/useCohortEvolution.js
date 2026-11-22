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
import { EVOLUTION_QUERY_TIMEOUT_MS } from '../../../types/cohortEvolution.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getEvolutionSourceMode,
  getCohort,
  getUnits: getScheduleUnits,
  getEvolution: getCohortEvolution,
});

/*
 * Evolución temporal de una cohorte (RF-141), solo consulta.
 *
 * Pide a la vez el catálogo de unidades del cronograma y la serie, cada
 * uno con su tiempo límite. Aquí se usa Promise.all A PROPÓSITO: RF-141
 * exige una serie completa y coherente, así que si cualquiera de las dos
 * consultas falla no se presenta nada (ni una serie parcial ni datos
 * conservados en caché, a diferencia del panel RF-140).
 *
 * `filters` queda preparado para RF-135 (aún no existe): se reenvía a la
 * fuente en cada consulta y no se guarda. La página se monta de nuevo al
 * cambiar de cohorte (key), así que nunca quedan datos de otra.
 */
export function useCohortEvolution({
  cohortId,
  filters = null,
  source = DEFAULT_SOURCE,
  timeoutMs = EVOLUTION_QUERY_TIMEOUT_MS,
} = {}) {
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
        const [catalog, response] = await Promise.all([
          withTimeout(
            Promise.resolve().then(() => source.getUnits(cohortId)),
            timeoutMs,
          ),
          withTimeout(
            Promise.resolve().then(() =>
              source.getEvolution(cohortId, { filters }),
            ),
            timeoutMs,
          ),
        ]);

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
  }, [attempt, cohortId, filters, isIntegrationPending, source, timeoutMs]);

  return {
    cohort,
    view,
    isLoading,
    isDemo: mode === AGGREGATE_SOURCE_MODE.DEMO,
    isIntegrationPending,
    retry: () => setAttempt((value) => value + 1),
  };
}
