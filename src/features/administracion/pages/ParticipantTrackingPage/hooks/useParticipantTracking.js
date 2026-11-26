import { useEffect, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import { getTrackingSourceMode, listCohortTracking } from '../../../data/trackingSource.js';
import { normalizeParticipantCode } from '../../../services/chatTraceabilityIds.js';
import { TRACKING_PROBLEM, classifyTrackingError } from '../../../services/trackingErrors.js';
import {
  hasActiveFilters,
  lastPageOffset,
  parseTrackingSearch,
  sortToValue,
  toTrackingSearch,
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

// Espera tras el último cambio de un filtro u orden antes de consultar.
export const TRACKING_DEBOUNCE_MS = 300;

const noNavigation = () => {};

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
 * La consulta vive en la URL (`search`): de ella sale lo que se pide, de
 * modo que recargar, compartir el enlace o ir atrás y adelante restituye
 * filtros, orden y página. `navigate` (el de React Router) la cambia sin
 * recargar el documento. Los cambios de filtros y orden se acumulan como
 * borrador y llegan a la URL, y por tanto al backend, 300 ms después del
 * último; la paginación y limpiar los filtros son inmediatos. Una URL con
 * parámetros desconocidos o inválidos se reescribe en su forma canónica
 * sin añadir una entrada al historial. La consulta se identifica por su
 * forma canónica: dos URL equivalentes no repiten la petición.
 *
 * `detailCode` de cada registro es el código con el que se abre la
 * ficha: en la API, solo un seudónimo A7 válido; en la demostración, el
 * código ficticio. Sin él, el registro no enlaza a ninguna ficha.
 */
export function useParticipantTracking({ cohortId, search = '', navigate = noNavigation, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isDemo = mode === TRACKING_SOURCE_MODE.DEMO;

  const query = parseTrackingSearch(search);
  const queryKey = toTrackingSearch(query);
  const currentSearch = String(search ?? '').replace(/^\?/, '');

  // Borrador de filtros y orden con la URL sobre la que se hizo: si la URL
  // cambia (atrás, adelante, enlace), el borrador deja de valer.
  const [draftState, setDraftState] = useState(null);
  const [cohort, setCohort] = useState(null);
  const [page, setPage] = useState(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [problem, setProblem] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const draft = draftState?.base === currentSearch ? draftState.query : null;
  const shown = draft ?? query;
  const editDraft = (change) =>
    setDraftState((current) => ({
      base: currentSearch,
      query: change(current?.base === currentSearch ? current.query : query),
    }));

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

  // URL no canónica (parámetros ajenos, valores inválidos): se reescribe
  // sin entrada nueva en el historial.
  useEffect(() => {
    if (currentSearch !== queryKey) navigate({ search: queryKey }, { replace: true });
  }, [currentSearch, navigate, queryKey]);

  // Filtros y orden: a la URL 300 ms después del último cambio.
  useEffect(() => {
    if (!draft) return undefined;

    const timer = setTimeout(() => {
      const next = toTrackingSearch(draft);

      if (next === queryKey) setDraftState(null);
      else navigate({ search: next });
    }, TRACKING_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, navigate, queryKey]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const current = parseTrackingSearch(queryKey);

    async function load() {
      setIsLoading(true);
      setProblem(null);

      try {
        const result = interpretTrackingResponse(await source.list(cohortId, current, { signal: controller.signal }));
        if (!active) return;

        const lastOffset = result.outcome === TRACKING_OUTCOME.OK ? lastPageOffset(result.total, current.limit) : null;

        if (result.outcome !== TRACKING_OUTCOME.OK || (isOutOfRange(result) && lastOffset === current.offset)) {
          setPage(EMPTY_PAGE);
          setProblem(TRACKING_PROBLEM.INVALID_RESPONSE);
        } else if (isOutOfRange(result)) {
          // Página que ya no existe: se pide la última, sin inventar filas.
          navigate({ search: toTrackingSearch(withOffset(current, lastOffset)) }, { replace: true });
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
  }, [attempt, cohortId, navigate, queryKey, source]);

  // Paginar y limpiar: inmediatos, con entrada en el historial.
  const goTo = (next) => {
    setDraftState(null);
    const nextSearch = toTrackingSearch(next);
    if (nextSearch !== queryKey) navigate({ search: nextSearch });
  };

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
    filters: shown.filters,
    sort: shown.sort,
    sortValue: sortToValue(shown.sort),
    hasFilters: hasActiveFilters(shown),
    isLoading,
    problem,
    canRetry: RETRYABLE.includes(problem),
    isDemo,
    setFilter: (name, value) => editDraft((current) => withFilter(current, name, value)),
    setSort: (value) => editDraft((current) => withSort(current, valueToSort(value))),
    setColumnSort: (sort) => goTo(withSort(shown, sort)),
    clearFilters: () => goTo(withoutFilters(shown)),
    goBack: () => goTo(withPage(query, -1, total)),
    goForward: () => goTo(withPage(query, 1, total)),
    retry: () => setAttempt((value) => value + 1),
  };
}
