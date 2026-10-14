import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const eliminarRecursoContenido = async (resourceId) => {
  await apiClient.delete(
    `${CRONOGRAMA}/recursos/${encodeURIComponent(resourceId)}`,
  );
};