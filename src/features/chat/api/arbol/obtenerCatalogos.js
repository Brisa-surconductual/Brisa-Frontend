import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: GET /chat/admin/catalogos. Responde `{ data: { tipos_nodo,
// tipos_entrada, reglas_validacion, enums } }`.
export async function obtenerCatalogos() {
  try {
    const response = await apiClient.get(`${CHAT}/admin/catalogos`);
    const catalogos = response.data?.data;

    if (!catalogos?.enums) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return catalogos;
  } catch (error) {
    throw toChatApiError(error);
  }
}
