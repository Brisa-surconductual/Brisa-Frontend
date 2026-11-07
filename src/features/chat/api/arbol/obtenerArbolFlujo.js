import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: GET /chat/admin/flujos/:id_flujo. Responde `{ data: { flujo,
// nodos, transiciones } }`. En cada transición `id_regla` es el id de la
// transición (así lo nombra el backend).
export async function obtenerArbolFlujo(idFlujo) {
  try {
    const response = await apiClient.get(
      `${CHAT}/admin/flujos/${encodeURIComponent(idFlujo)}`,
    );
    const arbol = response.data?.data;

    if (
      !arbol?.flujo ||
      !Array.isArray(arbol.nodos) ||
      !Array.isArray(arbol.transiciones)
    ) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return arbol;
  } catch (error) {
    throw toChatApiError(error);
  }
}
