import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const obtenerMiContenidoVigente = async () => {
  const response = await apiClient.get(`${CRONOGRAMA}/me/contenidos-vigentes`);

  if (response.status === 204) {
    return [];
  }

  return response.data;
};
