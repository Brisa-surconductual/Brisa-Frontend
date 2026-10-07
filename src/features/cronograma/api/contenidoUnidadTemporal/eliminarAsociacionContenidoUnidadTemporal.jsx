import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const eliminarAsociacionContenidoUnidadTemporal = async (
  associationId,
) => {
  const { data } = await apiClient.delete(
    `${CRONOGRAMA}/eliminar-asociacion-contenido-unidad-temporal`,
    {
      data: {
        id_contenido_cronograma: associationId,
      },
    },
  );

  return data;
};