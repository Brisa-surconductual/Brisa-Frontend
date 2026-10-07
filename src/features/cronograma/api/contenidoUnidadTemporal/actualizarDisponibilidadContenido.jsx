import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const actualizarDisponibilidadContenido = async ({
  associationId,
  availableFrom,
  availableUntil,
}) => {
  const { data } = await apiClient.patch(
    `${CRONOGRAMA}/actualizar-disponibilidad-contenido`,
    {
      idContenidoCronograma: associationId,
      fechaInicioDisponibilidad: availableFrom,
      fechaFinDisponibilidad: availableUntil,
    },
  );

  return data;
};