import { apiClient } from '@/shared/utils/apiClient.jsx';

import { MODALIDAD } from '../../types/estadosChat.js';
import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

import { RUTA_ARBOLES_PERSONALIZADOS } from './rutaArbolesPersonalizados.js';

// RF-25C: POST /chat/administracion/arboles-personalizados. Crea un borrador
// para la combinación de perfil; el backend asigna la siguiente versión.
export async function crearArbolPersonalizado({
  nombre,
  tipoDependencia,
  tipoCraving,
}) {
  try {
    const response = await apiClient.post(RUTA_ARBOLES_PERSONALIZADOS, {
      nombre,
      modalidad: MODALIDAD.PERSONALIZADA,
      tipo_dependencia: tipoDependencia,
      tipo_craving: tipoCraving,
    });

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
