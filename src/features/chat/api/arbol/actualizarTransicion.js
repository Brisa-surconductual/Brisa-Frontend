import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25 (03-F): PATCH /chat/admin/transiciones/:id_regla. Edición parcial:
// solo se envían los campos que cambian (un cuerpo vacío lo rechaza el
// backend). El nodo origen no se puede editar.
export async function actualizarTransicion(idTransicion, cambios) {
  try {
    const response = await apiClient.patch(
      `${CHAT}/admin/transiciones/${encodeURIComponent(idTransicion)}`,
      cambios,
    );
    const transicion = response.data?.data;

    if (!transicion?.id_regla) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return transicion;
  } catch (error) {
    throw toChatApiError(error);
  }
}
