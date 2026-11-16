import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-25 (03-E): POST /chat/admin/flujos/:id_flujo/transiciones. Solo flujos
// en BORRADOR. Body: { id_nodo_origen, id_nodo_destino, operador_condicion,
// valor_condicion, orden_evaluacion, y exactamente uno de
// id_regla_validacion (reutilizar) o regla_validacion (embebida) }.
export async function crearTransicion(idFlujo, payload) {
  try {
    const response = await apiClient.post(
      `${CHAT}/admin/flujos/${encodeURIComponent(idFlujo)}/transiciones`,
      payload,
    );
    const transicion = response.data?.data;

    if (!transicion?.id_regla) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return transicion;
  } catch (error) {
    throw toChatApiError(error);
  }
}
