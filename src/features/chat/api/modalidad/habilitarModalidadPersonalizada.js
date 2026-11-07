import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25B: POST /chat/admin/modalidad/habilitar-personalizada. El backend
// exige `confirmacion_transicion: true`: la confirmación del administrador
// ya se pidió en la interfaz antes de llamar a esta función.
// Responde (sin `{ data }`): { id_programa, modalidad, usuarios_actualizados,
// fecha_vigencia_desde, administrador_responsable }
export async function habilitarModalidadPersonalizada(idPrograma) {
  try {
    const response = await apiClient.post(
      `${CHAT}/admin/modalidad/habilitar-personalizada`,
      { id_programa: idPrograma, confirmacion_transicion: true },
    );

    if (!response.data?.modalidad) {
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
