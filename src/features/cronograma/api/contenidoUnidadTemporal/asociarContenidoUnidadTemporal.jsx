import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const asociarContenidoUnidadTemporal = async ({
  contentId,
  temporalUnitId,
  availableFrom,
  availableUntil,
}) => {
  const { data } = await apiClient.post(
    `${CRONOGRAMA}/asociar-contenido-unidad-temporal`,
    {
      idContenido: contentId,
      idUnidadTemporal: temporalUnitId,
      fechaInicioDisponibilidad: availableFrom,
      fechaFinDisponibilidad: availableUntil,
    },
  );

  return data;
};