import { CRONOGRAMA } from '@/shared/utils/constans.jsx';
import { apiClient } from '@/shared/utils/apiClient.jsx';

export async function obtenerMiCronograma() {
  const { data } = await apiClient.get(`${CRONOGRAMA}/me`);
  return data;
}
