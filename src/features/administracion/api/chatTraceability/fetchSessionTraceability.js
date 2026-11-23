import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

/*
 * RF-38: GET /chat/admin/sesiones/{id_sesion}/trazabilidad. Siempre se
 * envía `codigo_participante`: el backend comprueba que la sesión sea de
 * ese participante y, si no, responde 404 SESION_NO_ENCONTRADA. Solo
 * lectura, con la cookie de sesión. Devuelve el contenido de `{ data }`
 * sin interpretar (services/sessionTraceResponse.js lo valida). Una
 * petición cancelada se relanza sin normalizar.
 */
export async function fetchSessionTraceability(
  sessionId,
  participantCode,
  { signal } = {},
) {
  try {
    const response = await apiClient.get(
      `${CHAT}/admin/sesiones/${encodeURIComponent(sessionId)}/trazabilidad`,
      { params: { codigo_participante: participantCode }, signal },
    );

    return response.data?.data;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw toApiError(error);
  }
}
