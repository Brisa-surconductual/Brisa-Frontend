import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const obtenerUbicacionTemporalParticipante = async (userId) => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/participantes/ubicaciones-temporales`,
    {
      params: {
        id_usuario: userId,
        page: 1,
        page_size: 1,
      },
    },
  );

  return data?.participantes?.[0] ?? null;
};