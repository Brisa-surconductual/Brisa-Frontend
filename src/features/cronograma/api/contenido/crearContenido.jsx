import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const crearContenido = async ({
  name,
  type,
}) => {
  const { data } = await apiClient.post(
    `${CRONOGRAMA}/contenidos`,
    {
      nombre_contenido: name,
      tipo_contenido: type,
    },
  );

  return data;
};