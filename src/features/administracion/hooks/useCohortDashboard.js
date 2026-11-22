import { useEffect, useRef, useState } from 'react';

import { DASHBOARD_SOURCE } from '../data/cohortDashboardSource.js';
import { findActiveCohort } from '../services/activeCohort.js';
import {
  assembleDashboard,
  loadDashboardSection,
  loadDashboardSections,
  rememberValidSections,
  withTimeout,
} from '../services/cohortDashboard.js';
import { dashboardCache } from '../services/dashboardCache.js';
import {
  ACTIVE_COHORT_RESULT,
  DASHBOARD_QUERY_TIMEOUT_MS,
  DASHBOARD_STATUS,
  SECTION_OUTCOME,
} from '../types/cohortDashboard.js';

const EMPTY = Object.freeze({
  cohort: null,
  activeCohorts: Object.freeze([]),
  results: null,
  loadedAt: null,
});

const STATUS_BY_RESULT = Object.freeze({
  [ACTIVE_COHORT_RESULT.NONE]: DASHBOARD_STATUS.NO_ACTIVE_COHORT,
  [ACTIVE_COHORT_RESULT.MULTIPLE]: DASHBOARD_STATUS.MULTIPLE_ACTIVE_COHORTS,
});

/*
 * Panel principal del módulo administrativo (RF-140), solo consulta.
 * 1. Identifica la cohorte ACTIVA con la fuente de cohortes (RF-124).
 * 2. Consulta las tres vistas a la vez (services/cohortDashboard.js):
 *    cada sección con su tiempo límite, su resultado y su reintento.
 * 3. Conserva en memoria las vistas válidas, por cohorte, para el caso
 *    en que ninguna fuente responda (services/dashboardCache.js).
 *
 * Cada recarga completa empieza sin los indicadores anteriores: si la
 * cohorte activa cambia, nunca quedan en pantalla los de otra. Un
 * reintento de sección que termina después de una recarga se descarta.
 * `source`, `cache` y `timeoutMs` permiten sustituirlos en las pruebas.
 */
export function useCohortDashboard({
  source = DASHBOARD_SOURCE,
  cache = dashboardCache,
  timeoutMs = DASHBOARD_QUERY_TIMEOUT_MS,
} = {}) {
  const [isIntegrationPending] = useState(() => source.isIntegrationPending());
  const [state, setState] = useState(() => ({
    status: isIntegrationPending
      ? DASHBOARD_STATUS.PENDING_INTEGRATION
      : DASHBOARD_STATUS.LOADING,
    ...EMPTY,
  }));
  const [retrying, setRetrying] = useState(() => Object.freeze([]));
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    generation.current += 1;
    let active = true;

    async function load() {
      setState({ status: DASHBOARD_STATUS.LOADING, ...EMPTY });
      setRetrying(Object.freeze([]));

      let cohorts;

      try {
        cohorts = await withTimeout(
          Promise.resolve().then(() => source.listCohorts()),
          timeoutMs,
        );
      } catch {
        if (active)
          setState({ status: DASHBOARD_STATUS.COHORTS_ERROR, ...EMPTY });
        return;
      }

      if (!active) return;

      const { result, cohort, activeCohorts } = findActiveCohort(cohorts);

      if (result !== ACTIVE_COHORT_RESULT.FOUND) {
        setState({ status: STATUS_BY_RESULT[result], ...EMPTY, activeCohorts });
        return;
      }

      // Fecha y hora en que se genera la consulta consolidada.
      const loadedAt = new Date().toISOString();
      setState({ status: DASHBOARD_STATUS.LOADING, ...EMPTY, cohort });

      const results = await loadDashboardSections(
        cohort.id,
        source.queries,
        timeoutMs,
      );

      if (!active) return;

      rememberValidSections(cache, cohort.id, results, loadedAt);
      setState({
        status: DASHBOARD_STATUS.READY,
        cohort,
        activeCohorts,
        results,
        loadedAt,
      });
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cache, isIntegrationPending, source, timeoutMs]);

  async function retrySection(section) {
    const cohortId = state.cohort?.id;

    if (state.status !== DASHBOARD_STATUS.READY || !cohortId) return;

    const requestGeneration = generation.current;
    setRetrying((current) => Object.freeze([...current, section]));

    const result = await loadDashboardSection(
      section,
      cohortId,
      source.queries,
      timeoutMs,
    );

    // Una recarga completa empezó mientras tanto: se descarta.
    if (generation.current !== requestGeneration) return;

    if (result.outcome === SECTION_OUTCOME.RESPONDED) {
      cache.remember(cohortId, section, result.view, new Date().toISOString());
    }

    setState((current) =>
      current.cohort?.id === cohortId && current.results
        ? { ...current, results: { ...current.results, [section]: result } }
        : current,
    );
    setRetrying((current) =>
      Object.freeze(current.filter((item) => item !== section)),
    );
  }

  const dashboard =
    state.status === DASHBOARD_STATUS.READY && state.results
      ? assembleDashboard({
          cohortId: state.cohort.id,
          results: state.results,
          loadedAt: state.loadedAt,
          cache,
        })
      : null;

  return {
    status: state.status,
    cohort: state.cohort,
    activeCohorts: state.activeCohorts,
    dashboard,
    retryingSections: retrying,
    isDemo: !isIntegrationPending,
    isIntegrationPending,
    reload: () => setAttempt((value) => value + 1),
    retrySection,
  };
}
