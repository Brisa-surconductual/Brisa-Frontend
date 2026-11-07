import { apiClient } from '@/shared/utils/apiClient.jsx';
import { CHAT } from '@/shared/utils/constans.jsx';

import {
  CHAT_CLIENT_ERROR,
  createChatApiError,
  toChatApiError,
} from '../chatApiUtils.js';

// RF-24: el backend crea la sesión o reanuda la activa. La identidad sale
// de la cookie (el front nunca envía id_usuario).
// El cuerpo es `{}`, nunca `null`: con Content-Type JSON axios serializa
// `null` como el texto "null" y el backend responde 400.
async function solicitar() {
  try {
    const response = await apiClient.post(`${CHAT}/sesiones/iniciar`, {});
    const data = response.data?.data;

    if (!data?.sesion || !data?.nodo_actual) {
      throw createChatApiError({
        code: CHAT_CLIENT_ERROR.RESPUESTA_INVALIDA,
        status: response.status,
      });
    }

    return data;
  } catch (error) {
    throw toChatApiError(error);
  }
}

// Mientras una solicitud siga en curso se comparte su promesa: evita
// crear dos sesiones si la pantalla se monta dos veces (StrictMode).
let solicitudEnCurso = null;

export function iniciarSesionConversacional() {
  if (!solicitudEnCurso) {
    solicitudEnCurso = solicitar().finally(() => {
      solicitudEnCurso = null;
    });
  }

  return solicitudEnCurso;
}
