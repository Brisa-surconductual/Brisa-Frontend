import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

import { conIdPeticion } from '../chatApiUtils.js';

// RF-31 / RF-32: GET /chat/sesiones/{id_sesion}/historial. Solo lectura y
// sin CSRF. Sin `antesDeSecuencia` devuelve las interacciones más
// recientes; con él, las de `secuencia < antesDeSecuencia` (el
// `siguiente_cursor` de la página ya cargada). `limite` va de 1 a 20; si
// se omite, el backend usa 20. La identidad sale de la cookie: nunca se
// envía id_usuario. Llega en `{ data: { items, hay_mas, siguiente_cursor } }`.
export async function obtenerHistorialInteracciones(
  idSesion,
  { antesDeSecuencia, limite } = {},
) {
  const params = {};
  if (Number.isInteger(antesDeSecuencia)) {
    params.antes_de_secuencia = antesDeSecuencia;
  }
  if (Number.isInteger(limite)) params.limite = limite;

  try {
    const response = await apiClient.get(
      `${CHAT}/sesiones/${encodeURIComponent(idSesion)}/historial`,
      conIdPeticion({
        params: Object.keys(params).length > 0 ? params : undefined,
      }),
    );

    return response.data?.data;
  } catch (error) {
    throw toApiError(error);
  }
}
