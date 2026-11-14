import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: POST /chat/admin/flujos/:id_flujo/archivar. Funciona desde borrador
// o publicado; es un camino sin retorno: no hay "desarchivar" ni "despublicar".
export async function archivarFlujo(idFlujo) {
  try {
    const response = await apiClient.post(
      `${CHAT}/admin/flujos/${encodeURIComponent(idFlujo)}/archivar`,
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
