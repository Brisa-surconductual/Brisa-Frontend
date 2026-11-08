import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

// RF-27 a RF-29: un solo POST captura, valida y avanza. El cuerpo se arma
// campo por campo para que nada más viaje (nunca id_usuario: la identidad
// sale de la cookie). El X-CSRF-Token lo pone apiClient.
// Reenviar el mismo `idRespuesta` devuelve el resultado original (D7).
export async function enviarRespuesta(
  idSesion,
  { idRespuesta, idNodo, tipoEntrada, valor, capturadaEn },
) {
  try {
    const response = await apiClient.post(
      `${CHAT}/sesiones/${encodeURIComponent(idSesion)}/respuestas`,
      {
        idRespuesta,
        idNodo,
        tipoEntrada,
        valor,
        capturadaEn,
        // Única conectividad de la Etapa 2 (A-025).
        conectividad: 'EN_LINEA',
      },
    );

    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
