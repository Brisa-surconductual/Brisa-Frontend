import { useEffect, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import { getTrackingSourceMode, listCohortTracking } from '../../../data/trackingSource.js';
import {
  INITIAL_TRACKING_QUERY,
  hasActiveFilters,
  sortToValue,
  valueToSort,
  withFilter,
  withPage,
  withSort,
  withoutFilters,
} from '../../../services/trackingQuery.js';
import { interpretTrackingResponse } from '../../../services/trackingResponse.js';
import {
  TRACKING_OUTCOME,
  TRACKING_QUERY_ERROR,
  TRACKING_SOURCE_MODE,
} from '../../../types/participantTracking.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getTrackingSourceMode,
  getCohort,
  list: listCohortTracking,
});

// Motivo por el que no se muestran registros.
export const TRACKING_PROBLEM = Object.freeze({
  DENIED: 'DENIED',
  NOT_FOUND: 'NOT_FOUND',
  INCONSISTENT: 'INCONSISTENT',
  ERROR: 'ERROR',
});

const EMPTY_PAGE = Object.freeze({ entries: Object.freeze([]), total: 0, offset: 0, blockedCount: 0 });

/*
 * Seguimiento de los participantes de una cohorte (RF-142), solo
 * consulta. Pide a la fuente filtros, orden y paginación (no los aplica
 * aquí) y muestra registros solo si la respuesta trae autorización
 * explícita y corresponde a la cohorte (services/trackingResponse.js).
 * Los errores se distinguen por código, nunca por texto; un fallo o una
 * denegación nunca dejan registros visibles ni se reemplazan por datos
 * ficticios. `source` permite sustituir la fuente sin cambiar la página.
 */
export function useParticipantTracking({ cohortId, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending = mode === TRACKING_SOURCE_MODE.PENDING_INTEGRATION;

  const [query, setQuery] = useState(INITIAL_TRACKING_QUERY);
  const [cohort, setCohort] = useState(null);
  const [page, setPage] = useState(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [problem, setProblem] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Datos de la cohorte para el encabezado (no son datos de participantes).
  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    source.getCohort(cohortId).then(
      (value) => { if (active) setCohort(value ?? null); },
      () => { if (active) setCohort(null); },
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
      setProblem(null);

      try {
        const result = interpretTrackingResponse(await source.list(cohortId, query), cohortId);
        if (!active) return;

        if (result.outcome === TRACKING_OUTCOME.OK) {
          setPage(result);
        } else {
          setPage(EMPTY_PAGE);
          setProblem(result.outcome === TRACKING_OUTCOME.DENIED ? TRACKING_PROBLEM.DENIED : TRACKING_PROBLEM.INCONSISTENT);
        }
      } catch (error) {
        if (!active) return;

        setPage(EMPTY_PAGE);
        if (error?.code === TRACKING_QUERY_ERROR.ACCESS_DENIED) setProblem(TRACKING_PROBLEM.DENIED);
        else if (error?.code === TRACKING_QUERY_ERROR.COHORT_NOT_FOUND) setProblem(TRACKING_PROBLEM.NOT_FOUND);
        else setProblem(TRACKING_PROBLEM.ERROR);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isIntegrationPending, query, source]);

  const total = page.total;
  const from = total === 0 ? 0 : page.offset + 1;
  const to = Math.min(page.offset + page.entries.length, total);

  return {
    cohort,
    entries: page.entries,
    blockedCount: page.blockedCount,
    total,
    range: { from, to },
    pageNumber: Math.floor(query.offset / query.limit) + 1,
    pageCount: Math.max(1, Math.ceil(total / query.limit)),
    canGoBack: query.offset > 0,
    canGoForward: query.offset + query.limit < total,
    filters: query.filters,
    sortValue: sortToValue(query.sort),
    hasFilters: hasActiveFilters(query),
    isLoading,
    problem,
    isDemo: mode === TRACKING_SOURCE_MODE.DEMO,
    isIntegrationPending,
    setFilter: (name, value) => setQuery((current) => withFilter(current, name, value)),
    setSort: (value) => setQuery((current) => withSort(current, valueToSort(value))),
    clearFilters: () => setQuery((current) => withoutFilters(current)),
    goBack: () => setQuery((current) => withPage(current, -1, total)),
    goForward: () => setQuery((current) => withPage(current, 1, total)),
    retry: () => setAttempt((value) => value + 1),
  };
}
