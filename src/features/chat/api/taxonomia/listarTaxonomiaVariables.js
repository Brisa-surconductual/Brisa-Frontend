import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-30B: GET /chat/taxonomia-variables. Responde `{ data: { version,
// variables: [{ codigo, nombre, descripcion, tipo_valor, valores,
// tipos_entrada_permitidos, etiquetas, habilitada, en_uso_publicado }] } }`.
// Por defecto solo las habilitadas (lo que ofrece el editor de nodos).
export async function listarTaxonomiaVariables({
  incluirDeshabilitadas = false,
} = {}) {
  try {
    const response = await apiClient.get(`${CHAT}/taxonomia-variables`, {
      params: incluirDeshabilitadas
        ? { incluir_deshabilitadas: true }
        : undefined,
    });
    const taxonomia = response.data?.data;

    if (!Array.isArray(taxonomia?.variables)) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return taxonomia;
  } catch (error) {
    throw toChatApiError(error);
  }
}
