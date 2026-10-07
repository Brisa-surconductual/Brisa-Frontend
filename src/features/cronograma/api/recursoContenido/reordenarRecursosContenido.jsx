import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const reordenarRecursosContenido = async ({
  contentId,
  resourceIds,
}) => {
  const { data } = await apiClient.patch(
    `${CRONOGRAMA}/contenidos/${encodeURIComponent(contentId)}/recursos/orden`,
    {
      id_recursos: resourceIds,
    },
  );

  return data;
};