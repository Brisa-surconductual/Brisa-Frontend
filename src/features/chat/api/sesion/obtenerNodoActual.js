import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

// RF-26: solo lectura, sin cuerpo y sin CSRF. La identidad sale de la
// cookie: el front nunca envía id_usuario. Respuesta sin `{ data }`.
export async function obtenerNodoActual(idSesion) {
  try {
    const response = await apiClient.get(
      `${CHAT}/sesiones/${encodeURIComponent(idSesion)}/nodo-actual`,
    );

    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
