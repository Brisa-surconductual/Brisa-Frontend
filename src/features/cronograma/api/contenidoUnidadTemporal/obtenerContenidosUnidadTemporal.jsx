import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const obtenerContenidosUnidadTemporal = async ({
  scheduleId,
  temporalUnitId,
}) => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/${encodeURIComponent(scheduleId)}/unidades-temporales/${encodeURIComponent(temporalUnitId)}/contenidos`,
  );

  return data;
};