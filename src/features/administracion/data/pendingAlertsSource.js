import * as api from '../api/alertasPendientesApi.js';
import { PENDING_ALERTS_SOURCE_MODE } from '../types/pendingAlerts.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente de la bandeja de alertas pendientes (RF-146) y de su atención
 * (RF-147). Solo hay fuente real: en el modo de demostración del M08 las
 * cohortes son ficticias y una cohorte inventada nunca debe mezclarse con
 * una escritura real, así que la bandeja no consulta ni escribe. No hay
 * simulador para esta funcionalidad.
 */
const DEMO_UNAVAILABLE = 'La gestión de alertas no está disponible en la demostración.';

export function getPendingAlertsSourceMode(enabled = isCohortDemoEnabled()) {
  return enabled
    ? PENDING_ALERTS_SOURCE_MODE.DEMO_UNAVAILABLE
    : PENDING_ALERTS_SOURCE_MODE.API;
}

function realApi() {
  if (getPendingAlertsSourceMode() !== PENDING_ALERTS_SOURCE_MODE.API) {
    throw new Error(DEMO_UNAVAILABLE);
  }

  return api;
}

export async function fetchPendingAlerts(cohortId, query, options) {
  return realApi().fetchPendingAlerts(cohortId, query, options);
}

export async function attendAlert(alertId, reason) {
  return realApi().attendAlert(alertId, reason);
}
