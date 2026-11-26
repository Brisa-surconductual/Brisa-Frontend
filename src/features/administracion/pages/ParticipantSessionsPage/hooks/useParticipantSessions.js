import { useEffect, useRef, useState } from 'react';

import { fetchParticipantSessions } from '../../../api/chatTraceability/fetchParticipantSessions.js';
import { classifyTraceError } from '../../../services/chatTraceabilityError.js';
import { normalizeParticipantCode } from '../../../services/chatTraceabilityIds.js';
import {
  appendSessionsPage,
  interpretParticipantSessions,
} from '../../../services/participantSessionsResponse.js';
import {
  SESSIONS_PAGE_SIZE,
  TRACE_QUERY_STATUS,
} from '../../../types/chatTraceability.js';

// Fuente real (HTTP); las pruebas inyectan otra con la misma firma.
const DEFAULT_SOURCE = Object.freeze({ fetchSessions: fetchParticipantSessions });

const initialState = (code) =>
  Object.freeze({
    status: code ? TRACE_QUERY_STATUS.LOADING : TRACE_QUERY_STATUS.INVALID_ROUTE,
    page: null,
    error: null,
    isLoadingMore: false,
    loadMoreError: null,
  });

const BLOCKING_STATUSES = Object.freeze([
  TRACE_QUERY_STATUS.UNAUTHENTICATED,
  TRACE_QUERY_STATUS.DENIED,
]);

// Fallo de validación de la respuesta: sin mensaje del backend.
const responseFailure = (status) => Object.freeze({ status, message: '', canRetry: true });

/*
 * Sesiones conversacionales de un participante (RF-38), solo lectura.
 * - Con un código que no es A7 no se consulta nada.
 * - Al desmontarse (la página se vuelve a montar por cada participante)
 *   se cancelan las peticiones y se ignora cualquier respuesta tardía:
 *   nunca se muestran sesiones de otro participante.
 * - Un error no deja datos y no se sustituye por datos ficticios. Solo se
 *   reintenta por acción del usuario.
 * - El cursor se envía tal cual lo dio el backend.
 */
export function useParticipantSessions({ participantCode, source = DEFAULT_SOURCE } = {}) {
  const code = normalizeParticipantCode(participantCode);
  const [state, setState] = useState(() => initialState(code));
  const [attempt, setAttempt] = useState(0);
  const loadMoreRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!code) return undefined;

    const controller = new AbortController();

    async function load() {
      setState(initialState(code));

      try {
        const data = await source.fetchSessions(code, {
          limit: SESSIONS_PAGE_SIZE,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        const result = interpretParticipantSessions(data, { code });
        setState({
          ...initialState(code),
          status: result.ok ? TRACE_QUERY_STATUS.READY : result.status,
          page: result.ok ? result.page : null,
          error: result.ok ? null : responseFailure(result.status),
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        const failure = classifyTraceError(error);
        setState({ ...initialState(code), status: failure.status, error: failure });
      }
    }

    void load();

    return () => {
      controller.abort();
      loadMoreRef.current?.abort();
    };
  }, [attempt, code, source]);

  async function loadMore() {
    const current = state.page;

    if (state.status !== TRACE_QUERY_STATUS.READY || !current?.nextCursor || state.isLoadingMore) {
      return;
    }

    loadMoreRef.current?.abort();
    const controller = new AbortController();
    loadMoreRef.current = controller;
    setState((previous) => ({ ...previous, isLoadingMore: true, loadMoreError: null }));

    // Solo se aplica sobre la misma página que originó la petición.
    const apply = (update) =>
      setState((previous) => (previous.page === current ? update(previous) : previous));

    try {
      const data = await source.fetchSessions(code, {
        limit: SESSIONS_PAGE_SIZE,
        cursor: current.nextCursor,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const next = interpretParticipantSessions(data, { code });
      const merged = next.ok ? appendSessionsPage(current, next.page) : next;

      apply((previous) =>
        merged.ok
          ? { ...previous, page: merged.page, isLoadingMore: false }
          : { ...previous, isLoadingMore: false, loadMoreError: responseFailure(merged.status) },
      );
    } catch (error) {
      if (controller.signal.aborted) return;

      const failure = classifyTraceError(error);
      // Sin sesión o sin permiso se bloquea también lo ya mostrado.
      const blocking = BLOCKING_STATUSES.includes(failure.status);
      apply((previous) =>
        blocking
          ? { ...initialState(code), status: failure.status, error: failure }
          : { ...previous, isLoadingMore: false, loadMoreError: failure },
      );
    }
  }

  return {
    code,
    ...state,
    headingRef,
    loadMore,
    retry: () => setAttempt((value) => value + 1),
  };
}
