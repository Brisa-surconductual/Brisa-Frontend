import { CRONOGRAMA } from '@/shared/utils/constans.jsx';
import { apiClient } from '@/shared/utils/apiClient.jsx';

export async function activarCronograma(idCronograma) {
  const { data } = await apiClient.post(
    `${CRONOGRAMA}/${encodeURIComponent(idCronograma)}/activar`,
    { confirmacion_activacion: true },
  );
  return data;
}
