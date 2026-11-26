import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: PATCH /chat/admin/nodos/:id_nodo. Edición parcial: solo se envían
// los campos que cambian (un cuerpo vacío lo rechaza el backend).
export async function actualizarNodo(idNodo, cambios) {
  try {
    const response = await apiClient.patch(
      `${CHAT}/admin/nodos/${encodeURIComponent(idNodo)}`,
      cambios,
    );
    const nodo = response.data?.data;

    if (!nodo?.id_nodo) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return nodo;
  } catch (error) {
    throw toChatApiError(error);
  }
}
