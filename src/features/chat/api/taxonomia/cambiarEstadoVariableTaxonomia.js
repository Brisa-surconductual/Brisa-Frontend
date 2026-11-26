import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-30B: PATCH /chat/taxonomia-variables/:codigo con { habilitada }.
// Responde `{ data: { version, variable } }`. Errores: 404
// VARIABLE_NO_ENCONTRADA, 409 VARIABLE_EN_USO_PUBLICADO.
export async function cambiarEstadoVariableTaxonomia(codigo, habilitada) {
  try {
    const response = await apiClient.patch(
      `${CHAT}/taxonomia-variables/${encodeURIComponent(codigo)}`,
      { habilitada },
    );
    const resultado = response.data?.data;

    if (!resultado?.variable?.codigo) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return resultado;
  } catch (error) {
    throw toChatApiError(error);
  }
}
