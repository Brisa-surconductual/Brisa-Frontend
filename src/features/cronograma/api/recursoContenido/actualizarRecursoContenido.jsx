import { CRONOGRAMA } from '../../../../shared/utils/constans.jsx';
import { apiClient } from '../../../../shared/utils/apiClient.jsx';

export const actualizarRecursoContenido = async ({
  resourceId,
  textContent,
  moduleIds,
  alternativeText,
  durationSeconds,
  storageKey,
  mimeType,
  sizeBytes,
}) => {
  const payload = {};

  if (textContent !== undefined) {
    payload.texto_contenido = textContent;
  }

  if (moduleIds !== undefined) {
    payload.id_modulos = moduleIds;
  }

  if (alternativeText !== undefined) {
    payload.texto_alternativo = alternativeText;
  }

  if (durationSeconds !== undefined) {
    payload.duracion_segundos = durationSeconds;
  }

  if (storageKey !== undefined) {
    payload.clave_almacenamiento = storageKey;
  }

  if (mimeType !== undefined) {
    payload.mime_type = mimeType;
  }

  if (sizeBytes !== undefined) {
    payload.tamano_bytes = sizeBytes;
  }

  const { data } = await apiClient.patch(
    `${CRONOGRAMA}/recursos/${encodeURIComponent(resourceId)}`,
    payload,
  );

  return data;
};