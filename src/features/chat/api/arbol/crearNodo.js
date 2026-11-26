import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: POST /chat/admin/flujos/:id_flujo/nodos. Solo flujos en BORRADOR.
// Body: { id_tipo_nodo, contenido, es_nodo_inicial, orden? }.
export async function crearNodo(idFlujo, payload) {
  try {
    const response = await apiClient.post(
      `${CHAT}/admin/flujos/${encodeURIComponent(idFlujo)}/nodos`,
      payload,
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
