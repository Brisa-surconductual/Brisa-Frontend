import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: POST /chat/admin/flujos/:id_flujo/publicar. Solo un borrador puede
// publicarse; el backend valida la estructura del árbol (nodo inicial,
// huérfanos, ciclos) antes de publicar y responde 422 si no es válida.
export async function publicarFlujo(idFlujo) {
  try {
    const response = await apiClient.post(
      `${CHAT}/admin/flujos/${encodeURIComponent(idFlujo)}/publicar`,
      {},
    );
    const flujo = response.data?.data;

    if (!flujo?.id_flujo) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return flujo;
  } catch (error) {
    throw toChatApiError(error);
  }
}
