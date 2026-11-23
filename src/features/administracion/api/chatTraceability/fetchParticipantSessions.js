import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

/*
 * RF-38 (ampliación para M08): GET
 * /chat/admin/participantes/{codigo_participante}/sesiones. Solo lectura,
 * con la cookie de sesión (sin CSRF ni cuerpo). `limite` va de 1 a 50 y
 * `cursor` es el `siguiente_cursor` anterior, enviado tal cual. Devuelve
 * el contenido de `{ data }` sin interpretar (services/
 * participantSessionsResponse.js lo valida). Una petición cancelada se
 * relanza sin normalizar para que el llamador la ignore.
 */
export async function fetchParticipantSessions(
  participantCode,
  { cursor, limit, signal } = {},
) {
  const params = {};
  if (Number.isInteger(limit)) params.limite = limit;
  if (typeof cursor === 'string' && cursor !== '') params.cursor = cursor;

  try {
    const response = await apiClient.get(
      `${CHAT}/admin/participantes/${encodeURIComponent(participantCode)}/sesiones`,
      { params, signal },
    );

    return response.data?.data;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw toApiError(error);
  }
}
