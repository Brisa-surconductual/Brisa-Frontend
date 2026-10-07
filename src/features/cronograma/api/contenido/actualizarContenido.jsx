import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const actualizarContenido = async ({
  id,
  name,
  type,
}) => {
  const { data } = await apiClient.patch(
    `${CRONOGRAMA}/contenidos/${encodeURIComponent(id)}`,
    {
      nombre_contenido: name,
      tipo_contenido: type,
    },
  );

  return data;
};