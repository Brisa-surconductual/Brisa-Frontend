import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const crearRecursoContenido = async ({
  contentId,
  type,
  order,
  textContent,
  storageKey,
  mimeType,
  sizeBytes,
  durationSeconds,
  alternativeText,
  moduleIds,
}) => {
  const payload = {
    id_contenido: contentId,
    tipo_recurso: type,
    orden_bloque: order,
    id_modulos: moduleIds,
  };

  if (textContent) {
    payload.texto_contenido = textContent;
  }

  if (storageKey) {
    payload.clave_almacenamiento = storageKey;
  }

  if (mimeType) {
    payload.mime_type = mimeType;
  }

  if (sizeBytes !== undefined) {
    payload.tamano_bytes = sizeBytes;
  }

  if (durationSeconds !== undefined) {
    payload.duracion_segundos = durationSeconds;
  }

  if (alternativeText) {
    payload.texto_alternativo = alternativeText;
  }

  const { data } = await apiClient.post(
    `${CRONOGRAMA}/recursos`,
    payload,
  );

  return data;
};