import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const listarModulosDestino = async () => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/modulos-destino`,
  );

  return data;
};