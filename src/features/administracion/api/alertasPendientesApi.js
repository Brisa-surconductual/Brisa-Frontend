import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';

import { ATTEND_ACTION } from '../types/pendingAlerts.js';

/*
 * RF-146 y RF-147. Cookies de sesión y X-CSRF-Token los pone apiClient.
 * Las respuestas llegan sin envoltura `{ data }`. Los errores se
 * normalizan con `toApiError` ({ status, codigo, mensaje }).
 */
const pendingPath = (cohortId) =>
  `/admin/cohortes/${encodeURIComponent(cohortId)}/alertas/pendientes`;
const attendPath = (alertId) =>
  `/admin/alertas/${encodeURIComponent(alertId)}/atender`;

/*
 * GET de la bandeja. `type` null = todas. Devuelve el cuerpo tal cual o
 * null si el backend respondió 204 (no hay alertas pendientes).
 */
export async function fetchPendingAlerts(cohortId, { type = null, offset, limit }, { signal } = {}) {
  try {
    const response = await apiClient.get(pendingPath(cohortId), {
      params: { ...(type && { tipo_alerta: type }), offset, limit },
      signal,
    });

    return response.status === 204 ? null : response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/*
 * POST irreversible. Solo viajan la acción y el motivo: el tipo y el
 * participante los toma el backend del módulo de seguimiento; el
 * identificador de la alerta va en la URL.
 */
export async function attendAlert(alertId, reason) {
  try {
    const response = await apiClient.post(attendPath(alertId), {
      accion: ATTEND_ACTION,
      motivo: reason,
    });

    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
