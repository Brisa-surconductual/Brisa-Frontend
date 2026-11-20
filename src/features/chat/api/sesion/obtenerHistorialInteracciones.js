import { apiClient } from '@/shared/utils/apiClient.jsx';
import { toApiError } from '@/shared/utils/apiError.js';
import { CHAT } from '@/shared/utils/constans.jsx';

// RF-31 / RF-32: historial reciente de la sesión, solo lectura y sin CSRF.
// `antesDe` pide la página anterior (secuencia más baja ya cargada). La
// identidad sale de la cookie: nunca se envía id_usuario. Llega en `{ data }`.
export async function obtenerHistorialInteracciones(
  idSesion,
  { antesDe } = {},
) {
  try {
    const response = await apiClient.get(
      `${CHAT}/sesiones/${encodeURIComponent(idSesion)}/interacciones`,
      { params: antesDe ? { antes_de: antesDe } : undefined },
    );

    return response.data?.data;
  } catch (error) {
    throw toApiError(error);
  }
}
