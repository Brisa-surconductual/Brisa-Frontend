import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const solicitarUrlSubidaRecurso = async ({
  contentId,
  type,
  mimeType,
  sizeBytes,
}) => {
  const { data } = await apiClient.post(
    `${CRONOGRAMA}/recursos/url-subida`,
    {
      id_contenido: contentId,
      tipo_recurso: type,
      mime_type: mimeType,
      tamano_bytes: sizeBytes,
    },
  );

  return data;
};