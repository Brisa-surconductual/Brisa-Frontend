import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const obtenerCatalogoContenidos = async () => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/contenidos/catalogo`,
  );

  return data;
};