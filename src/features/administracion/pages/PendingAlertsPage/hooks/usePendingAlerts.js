import { useEffect, useRef, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import {
  attendAlert,
  fetchPendingAlerts,
  getPendingAlertsSourceMode,
} from '../../../data/pendingAlertsSource.js';
import {
  InvalidPendingAlertsResponse,
  classifyAttendError,
  classifyPendingAlertsError,
  interpretPendingAlerts,
  isOutOfRange,
  lastPageOffset,
  pageInfo,
  validateAttendReason,
} from '../../../services/pendingAlerts.js';
import {
  ATTEND_OUTCOME,
  PENDING_ALERTS_LIMIT,
  PENDING_ALERTS_SOURCE_MODE,
  PENDING_ALERTS_STATUS as S,
} from '../../../types/pendingAlerts.js';

export const DEFAULT_PENDING_ALERTS_SOURCE = Object.freeze({
  getMode: () => getPendingAlertsSourceMode(),
  getCohort,
  fetchPendingAlerts,
  attendAlert,
});

const INITIAL_QUERY = Object.freeze({ type: null, offset: 0 });

const resultOf = (status, extra = {}) =>
  Object.freeze({ status, page: null, message: '', canRetry: false, ...extra });

/*
 * Bandeja de alertas pendientes de una cohorte (RF-146) y «Marcar como
 * atendida» (RF-147). La página se monta de nuevo por cohorte (key): nada
 * de otra cohorte se conserva. Además, cada consulta se cancela y su
 * respuesta se descarta si llega tarde.
 *
 * El filtro y la paginación los resuelve el servidor (offset/limit); la
 * lista nunca se modifica de forma optimista: tras atender se vuelve a
 * consultar.
 */
export function usePendingAlerts({ cohortId, source = DEFAULT_PENDING_ALERTS_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isDemo = mode === PENDING_ALERTS_SOURCE_MODE.DEMO_UNAVAILABLE;
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState(() =>
    resultOf(isDemo ? S.DEMO_UNAVAILABLE : S.LOADING),
  );
  const [cohort, setCohort] = useState(null);
  const [notice, setNotice] = useState(null);
  // El último POST terminó sin resultado conocido: hay que actualizar
  // la bandeja antes de volver a intentarlo.
  const [requiresRefresh, setRequiresRefresh] = useState(false);
  const [dialog, setDialog] = useState(null);
  // Candado síncrono contra el doble envío (antes de que React pinte).
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Nombre de la cohorte: solo informativo; su fallo no bloquea la bandeja.
  useEffect(() => {
    if (!cohortId) return undefined;
    let active = true;
    const update = (value) => {
      if (active) setCohort(value?.id === cohortId ? value : null);
    };

    void source.getCohort(cohortId).then(update, () => update(null));

    return () => {
      active = false;
    };
  }, [cohortId, source]);

  useEffect(() => {
    if (isDemo || !cohortId) return undefined;

    const controller = new AbortController();
    let active = true;

    async function load() {
      setResult(resultOf(S.LOADING));

      let data;
      try {
        data = await source.fetchPendingAlerts(
          cohortId,
          { type: query.type, offset: query.offset, limit: PENDING_ALERTS_LIMIT },
          { signal: controller.signal },
        );
      } catch (error) {
        if (active) setResult(resultOf(null, classifyPendingAlertsError(error)));
        return;
      }

      if (!active) return;

      if (data === null) {
        setResult(resultOf(S.EMPTY));
        setRequiresRefresh(false);
        return;
      }

      let page;
      try {
        page = interpretPendingAlerts(data);
      } catch (error) {
        setResult(resultOf(null, classifyPendingAlertsError(error)));
        return;
      }

      // Página fuera de rango (p. ej. se atendió la última de la página):
      // se pide la última que existe, sin inventar elementos.
      if (isOutOfRange(page)) {
        const offset = lastPageOffset(page.total, page.limit);

        if (offset !== query.offset) {
          setQuery((current) => ({ ...current, offset }));
          return;
        }

        setResult(resultOf(null, classifyPendingAlertsError(new InvalidPendingAlertsResponse())));
        return;
      }

      setResult(resultOf(S.READY, { page }));
      setRequiresRefresh(false);
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [cohortId, isDemo, query.offset, query.type, reloadKey, source]);

  const page = result.status === S.READY ? result.page : null;
  const busy = result.status === S.LOADING || Boolean(dialog?.submitting);

  function changeFilter(type) {
    if (busy || type === query.type) return;
    setNotice(null);
    setQuery({ type, offset: 0 });
  }

  function goToOffset(offset) {
    if (busy || !page) return;
    setQuery((current) => ({ ...current, offset }));
  }

  function reload() {
    setNotice(null);
    setReloadKey((value) => value + 1);
  }

  function openAttend(alert) {
    if (requiresRefresh || busy || !page) return;
    setDialog({ alert, reason: '', reasonError: '', error: '', submitting: false });
  }

  function changeReason(reason) {
    setDialog((current) =>
      current && !current.submitting ? { ...current, reason, reasonError: '' } : current,
    );
  }

  function cancelAttend() {
    if (submittingRef.current) return;
    setDialog(null);
  }

  async function confirmAttend() {
    if (submittingRef.current || !dialog) return;

    const { value, error } = validateAttendReason(dialog.reason);

    if (error) {
      setDialog({ ...dialog, reasonError: error });
      return;
    }

    const { alert } = dialog;
    submittingRef.current = true;
    setDialog({ ...dialog, submitting: true, reasonError: '', error: '' });

    try {
      await source.attendAlert(alert.id, value);
      if (!mountedRef.current) return;
      setDialog(null);
      setNotice({
        tone: 'success',
        text: `La alerta de ${alert.participantCode} quedó registrada como atendida.`,
      });
      setReloadKey((current) => current + 1);
    } catch (failure) {
      if (!mountedRef.current) return;

      const outcome = classifyAttendError(failure);

      if (outcome.outcome === ATTEND_OUTCOME.UNAUTHENTICATED) {
        setDialog(null);
        setResult(resultOf(S.UNAUTHENTICATED));
        return;
      }

      if (outcome.keepDialog) {
        setDialog((current) =>
          current && {
            ...current,
            submitting: false,
            ...(outcome.outcome === ATTEND_OUTCOME.INVALID_REASON
              ? { reasonError: outcome.message }
              : { error: outcome.message }),
          },
        );
        return;
      }

      setDialog(null);
      setNotice({
        tone: outcome.requiresRefresh || outcome.outcome === ATTEND_OUTCOME.DENIED ? 'danger' : 'info',
        text: outcome.message,
      });
      if (outcome.requiresRefresh) setRequiresRefresh(true);
      if (outcome.refresh) setReloadKey((current) => current + 1);
    } finally {
      submittingRef.current = false;
    }
  }

  return {
    cohort,
    isDemo,
    status: result.status,
    message: result.message,
    canRetry: result.canRetry,
    page,
    pagination: page ? pageInfo(page) : null,
    filter: query.type,
    busy,
    notice,
    requiresRefresh,
    dialog,
    changeFilter,
    goBack: () => page && goToOffset(Math.max(0, page.offset - page.limit)),
    goForward: () => page && goToOffset(page.offset + page.limit),
    retry: reload,
    refresh: reload,
    openAttend,
    changeReason,
    cancelAttend,
    confirmAttend: () => void confirmAttend(),
  };
}
