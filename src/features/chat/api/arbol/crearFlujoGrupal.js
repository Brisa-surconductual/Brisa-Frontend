import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import { MODALIDAD } from '../../types/estadosChat.js';
import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25: POST /chat/admin/flujos. Crea un flujo grupal en BORRADOR.
// Para GRUPAL el backend rechaza el perfil clínico: no se envía.
export async function crearFlujoGrupal({ nombre }) {
  try {
    const response = await apiClient.post(`${CHAT}/admin/flujos`, {
      nombre,
      modalidad: MODALIDAD.GRUPAL,
    });
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
