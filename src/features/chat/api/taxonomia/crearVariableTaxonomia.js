import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-30B: POST /chat/taxonomia-variables. Body: { codigo, nombre,
// descripcion?, tipo_valor, valores?, tipos_entrada_permitidos, etiquetas }.
// Responde `{ data: { version, variable } }`. Errores: 409
// VARIABLE_DUPLICADA, 422 DEFINICION_VARIABLE_INVALIDA.
export async function crearVariableTaxonomia(payload) {
  try {
    const response = await apiClient.post(
      `${CHAT}/taxonomia-variables`,
      payload,
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
