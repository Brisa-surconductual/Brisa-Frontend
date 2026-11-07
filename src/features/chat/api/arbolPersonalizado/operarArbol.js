import { apiClient } from '@/shared/utils/apiClient.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

import { RUTA_ARBOLES_PERSONALIZADOS } from './rutaArbolesPersonalizados.js';

// Ayuda común de las operaciones sobre un árbol existente (no es un endpoint): POST sin
// datos (cuerpo `{}`, nunca null) y respuesta con el flujo resultante.
export async function operarArbol(idFlujo, operacion) {
  try {
    const response = await apiClient.post(
      `${RUTA_ARBOLES_PERSONALIZADOS}/${encodeURIComponent(idFlujo)}/${operacion}`,
      {},
    );

    if (!response.data?.id_flujo) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return response.data;
  } catch (error) {
    throw toChatApiError(error);
  }
}
