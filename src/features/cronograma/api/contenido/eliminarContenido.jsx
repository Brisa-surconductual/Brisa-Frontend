import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const eliminarContenido = async (contentId) => {
  const { data } = await apiClient.delete(
    `${CRONOGRAMA}/contenidos/${encodeURIComponent(contentId)}`,
  );

  return data;
};