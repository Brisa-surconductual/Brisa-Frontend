import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const obtenerContenidoVigenteUsuario = async (userId) => {
  const response = await apiClient.get(
    `${CRONOGRAMA}/usuarios/${encodeURIComponent(userId)}/contenidos-vigentes`,
  );

  if (response.status === 204) {
    return [];
  }

  return response.data;
};