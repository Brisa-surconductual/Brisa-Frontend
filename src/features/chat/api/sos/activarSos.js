import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

import { conIdPeticion } from '../chatApiUtils.js';

// RF-43: POST /chat/sos/activar. Cookie y X-CSRF-Token (lo pone
// apiClient). El cuerpo solo lleva `contexto_origen` (módulo, ruta y el
// estado restaurable); sin contexto se envía `{}`, nunca `null` (axios lo
// serializaría como el texto "null"). Nunca id_usuario. Responde 201 con
// `{ data }`.
export async function activarSos(contextoOrigen = null) {
  const cuerpo = contextoOrigen
    ? {
        contexto_origen: {
          modulo: contextoOrigen.modulo,
          ruta: contextoOrigen.ruta,
          estado: contextoOrigen.estado ?? null,
        },
      }
    : {};

  try {
    const response = await apiClient.post(
      `${CHAT}/sos/activar`,
      cuerpo,
      conIdPeticion(),
    );

    return response.data?.data;
  } catch (error) {
    throw toApiError(error);
  }
}
