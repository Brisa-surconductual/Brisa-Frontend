import { useEffect, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import { getTrackingSourceMode, listCohortTracking } from '../../../data/trackingSource.js';
import { normalizeParticipantCode } from '../../../services/chatTraceabilityIds.js';
import { TRACKING_PROBLEM, classifyTrackingError } from '../../../services/trackingErrors.js';
import {
  INITIAL_TRACKING_QUERY,
  hasActiveFilters,
  lastPageOffset,
  sortToValue,
  valueToSort,
  withFilter,
  withOffset,
  withPage,
  withSort,
  withoutFilters,
} from '../../../services/trackingQuery.js';
import { interpretTrackingResponse, isOutOfRange } from '../../../services/trackingResponse.js';
import { TRACKING_OUTCOME, TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';

export { TRACKING_PROBLEM };

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getTrackingSourceMode,
  getCohort,
  list: listCohortTracking,
});

const EMPTY_PAGE = Object.freeze({ entries: Object.freeze([]), total: 0, offset: 0 });

// Problemas que permiten reintentar la misma consulta.
const RETRYABLE = Object.freeze([TRACKING_PROBLEM.UNAVAILABLE, TRACKING_PROBLEM.INVALID_RESPONSE, TRACKING_PROBLEM.ERROR]);

/*
 * Seguimiento de los participantes de una cohorte (RF-142), solo
 * consulta. Pide al backend filtros, orden y paginación (no los aplica
 * aquí). Los errores se distinguen por estado y código, nunca por texto;
 * un fallo o una denegación nunca dejan registros visibles ni se
 * reemplazan por datos ficticios. Cada consulta se cancela si llega otra
 * y su respuesta tardía se descarta. `source` permite sustituir la
 * fuente sin cambiar la página.
 *
 * `detailCode` de cada registro es el código con el que se abre la
 * ficha: en la API, solo un seudónimo A7 válido; en la demostración, el
 * código ficticio. Sin él, el registro no enlaza a ninguna ficha.
 */
export function useParticipantTracking({ cohortId, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isDemo = mode === TRACKING_SOURCE_MODE.DEMO;

  const [query, setQuery] = useState(INITIAL_TRACKING_QUERY);
  const [cohort, setCohort] = useState(null);
  const [page, setPage] = useState(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [problem, setProblem] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Datos de la cohorte para el encabezado (no son datos de participantes).
  useEffect(() => {
    let active = true;

    source.getCohort(cohortId).then(
      (value) => { if (active) setCohort(value ?? null); },
      () => { if (active) setCohort(null); },
    );

    return () => {
      active = false;
    };
  }, [attempt, cohortId, source]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setProblem(null);

      try {
        const result = interpretTrackingResponse(await source.list(cohortId, query, { signal: controller.signal }));
        if (!active) return;

        const lastOffset = result.outcome === TRACKING_OUTCOME.OK ? lastPageOffset(result.total, query.limit) : null;

        if (result.outcome !== TRACKING_OUTCOME.OK || (isOutOfRange(result) && lastOffset === query.offset)) {
          setPage(EMPTY_PAGE);
          setProblem(TRACKING_PROBLEM.INVALID_RESPONSE);
        } else if (isOutOfRange(result)) {
          // Página que ya no existe: se pide la última, sin inventar filas.
          setQuery((current) => withOffset(current, lastOffset));
          return;
        } else {
          setPage(result);
        }
      } catch (error) {
        if (!active) return;

        setPage(EMPTY_PAGE);
        setProblem(classifyTrackingError(error));
      }

      if (active) setIsLoading(false);
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, cohortId, query, source]);

  const total = page.total;
  const from = total === 0 ? 0 : page.offset + 1;
  const to = Math.min(page.offset + page.entries.length, total);
  const entries = page.entries.map((entry) =>
    Object.freeze({ ...entry, detailCode: isDemo ? entry.code : normalizeParticipantCode(entry.code) }),
  );

  return {
    cohort,
    entries,
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
    canRetry: RETRYABLE.includes(problem),
    isDemo,
    setFilter: (name, value) => setQuery((current) => withFilter(current, name, value)),
    setSort: (value) => setQuery((current) => withSort(current, valueToSort(value))),
    clearFilters: () => setQuery((current) => withoutFilters(current)),
    goBack: () => setQuery((current) => withPage(current, -1, total)),
    goForward: () => setQuery((current) => withPage(current, 1, total)),
    retry: () => setAttempt((value) => value + 1),
  };
}
