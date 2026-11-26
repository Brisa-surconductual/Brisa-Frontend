import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25B: GET /chat/admin/modalidad/elegibilidad. La respuesta NO viene
// envuelta en `{ data }`:
// { modalidad_actual, total_usuarios_activos, con_perfil_completo,
//   sin_perfil_completo, elegible }
export async function obtenerElegibilidadModalidad() {
  try {
    const response = await apiClient.get(
      `${CHAT}/admin/modalidad/elegibilidad`,
    );
    const elegibilidad = response.data;

    if (
      typeof elegibilidad?.elegible !== 'boolean' ||
      !Number.isInteger(elegibilidad?.total_usuarios_activos) ||
      !Number.isInteger(elegibilidad?.con_perfil_completo)
    ) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return elegibilidad;
  } catch (error) {
    throw toChatApiError(error);
  }
}
