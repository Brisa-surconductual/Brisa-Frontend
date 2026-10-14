import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const listarUbicacionesTemporalesParticipantes = async ({
  page = 1,
  pageSize = 50,
} = {}) => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/participantes/ubicaciones-temporales`,
    {
      params: {
        page,
        page_size: pageSize,
      },
    },
  );

  return data;
};