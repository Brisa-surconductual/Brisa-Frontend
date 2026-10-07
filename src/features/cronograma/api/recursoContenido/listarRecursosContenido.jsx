import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const listarRecursosContenido = async (contentId) => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/contenidos/${encodeURIComponent(contentId)}/recursos`,
  );

  return data;
};