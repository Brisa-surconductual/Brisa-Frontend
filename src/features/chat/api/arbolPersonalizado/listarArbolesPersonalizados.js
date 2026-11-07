import { apiClient } from '@/shared/utils/apiClient.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

import { RUTA_ARBOLES_PERSONALIZADOS } from './rutaArbolesPersonalizados.js';

// RF-25C: GET /chat/administracion/arboles-personalizados. Responde
// `{ combinaciones: [{ tipo_dependencia, tipo_craving, publicado, versiones }] }`
// con las cuatro combinaciones de perfil, aunque no tengan árboles.
export async function listarArbolesPersonalizados() {
  try {
    const response = await apiClient.get(RUTA_ARBOLES_PERSONALIZADOS);
    const combinaciones = response.data?.combinaciones;

    if (!Array.isArray(combinaciones)) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return combinaciones;
  } catch (error) {
    throw toChatApiError(error);
  }
}
