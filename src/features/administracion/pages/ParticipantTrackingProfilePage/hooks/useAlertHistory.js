import { useEffect, useState } from 'react';

import { getParticipantAlertHistory } from '../../../data/trackingSource.js';
import { hasActiveSummaryMismatch } from '../../../services/alertHistory.js';
import { interpretAlertHistoryResponse } from '../../../services/alertHistoryResponse.js';
import {
  ALERT_HISTORY_OUTCOME,
  ALERT_HISTORY_STATUS as HISTORY_STATUS,
  TRACKING_QUERY_ERROR,
} from '../../../types/participantTracking.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({ getHistory: getParticipantAlertHistory });

const STATUS_BY_CODE = Object.freeze({
  [TRACKING_QUERY_ERROR.ACCESS_DENIED]: HISTORY_STATUS.DENIED,
  [TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND]: HISTORY_STATUS.NOT_FOUND,
  [TRACKING_QUERY_ERROR.COHORT_NOT_FOUND]: HISTORY_STATUS.COHORT_NOT_FOUND,
  [TRACKING_QUERY_ERROR.OUTSIDE_COHORT]: HISTORY_STATUS.OUTSIDE_COHORT,
  [TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE]: HISTORY_STATUS.UNAVAILABLE,
});

const STATUS_BY_OUTCOME = Object.freeze({
  [ALERT_HISTORY_OUTCOME.OK]: HISTORY_STATUS.READY,
  [ALERT_HISTORY_OUTCOME.EMPTY]: HISTORY_STATUS.EMPTY,
  [ALERT_HISTORY_OUTCOME.DENIED]: HISTORY_STATUS.DENIED,
  [ALERT_HISTORY_OUTCOME.INCONSISTENT]: HISTORY_STATUS.INCONSISTENT,
  [ALERT_HISTORY_OUTCOME.MALFORMED]: HISTORY_STATUS.ERROR,
});

/*
 * Historial de alertas del participante (RF-129), solo consulta.
 *
 * `enabled` lo decide la ficha: solo se consulta cuando la ficha ya
 * confirmó acceso al participante (perfil disponible o sin perfil). Si
 * la ficha se deniega, falla o deja de estar lista, no se consulta y no
 * se expone ningún registro. Tiene su propio estado y su propio error:
 * un fallo del historial no oculta los indicadores de la ficha.
 *
 * `activeAlerts` (resumen de RF-128) solo sirve para detectar si difiere
 * de las alertas ACTIVA del historial; no se corrige ninguno.
 */
export function useAlertHistory({ cohortId, reference, enabled, activeAlerts = null, source = DEFAULT_SOURCE } = {}) {
  const [alerts, setAlerts] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;

    async function load() {
      setIsLoading(true);
      setStatus(null);
      setAlerts(null);

      try {
        const result = interpretAlertHistoryResponse(await source.getHistory(cohortId, reference), { cohortId, reference });
        if (!active) return;

        setAlerts(result.outcome === ALERT_HISTORY_OUTCOME.OK ? result.alerts : null);
        setStatus(STATUS_BY_OUTCOME[result.outcome] ?? HISTORY_STATUS.ERROR);
      } catch (error) {
        if (!active) return;

        setAlerts(null);
        setStatus(STATUS_BY_CODE[error?.code] ?? HISTORY_STATUS.ERROR);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, enabled, reference, source]);

  // Sin habilitar no se expone nada, aunque quede un resultado anterior.
  const visibleAlerts = enabled && status === HISTORY_STATUS.READY ? alerts : null;
  // Un historial vacío (204) también se compara: no tiene alertas activas.
  const compared = enabled && status === HISTORY_STATUS.EMPTY ? [] : visibleAlerts;

  return {
    alerts: visibleAlerts,
    status: enabled ? status : null,
    isLoading: Boolean(enabled) && (isLoading || status === null),
    hasSummaryMismatch: hasActiveSummaryMismatch(activeAlerts, compared),
    retry: () => setAttempt((value) => value + 1),
  };
}
