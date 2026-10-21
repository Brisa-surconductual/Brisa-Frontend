import { CRONOGRAMA } from '../../../../shared/utils/constans';
import { apiClient } from '../../../../shared/utils/apiClient';

export const assignScheduleToUser = async ({ userId, scheduleId, interrumpir }) => {
  const response = await apiClient.patch(
    `${CRONOGRAMA}/usuarios/${userId}/asignar-cronograma`,
    {
      id_cronograma_nuevo: scheduleId,
      interrumpir: interrumpir,
    }
  );

  return response.data;
};