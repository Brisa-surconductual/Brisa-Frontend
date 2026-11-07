import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: GET /chat/admin/flujos. Responde `{ data: { items }, meta }`
// (sin envoltorio adicional). Filtros: modalidad, estado, page, page_size.
export async function listarFlujos({
  modalidad,
  estado,
  page = 1,
  pageSize = 10,
} = {}) {
  try {
    const params = { page, page_size: pageSize };

    if (modalidad) params.modalidad = modalidad;
    if (estado) params.estado = estado;

    const response = await apiClient.get(`${CHAT}/admin/flujos`, { params });
    const { data, meta } = response.data ?? {};

    if (!Array.isArray(data?.items) || !meta) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return { items: data.items, meta };
  } catch (error) {
    throw toChatApiError(error);
  }
}
