import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

// RF-27 a RF-30: un solo POST captura, valida, persiste y avanza. El
// cuerpo se arma campo por campo con el contrato RF-30 para que nada más
// viaje (nunca id_usuario: la identidad sale de la cookie). El
// X-CSRF-Token lo pone apiClient. Reenviar el mismo `id_interaccion`
// devuelve el resultado original (D7). La respuesta llega en `{ data }`.
export async function enviarRespuesta(
  idSesion,
  {
    id_interaccion,
    id_nodo,
    secuencia,
    tipo_entrada,
    valor,
    timestamp_interaccion,
    estado_conectividad,
    recursos_no_presentados,
  },
) {
  try {
    const response = await apiClient.post(
      `${CHAT}/sesiones/${encodeURIComponent(idSesion)}/respuestas`,
      {
        id_interaccion,
        id_nodo,
        secuencia,
        tipo_entrada,
        valor,
        timestamp_interaccion,
        estado_conectividad,
        recursos_no_presentados,
      },
    );

    return response.data?.data;
  } catch (error) {
    throw toApiError(error);
  }
}
