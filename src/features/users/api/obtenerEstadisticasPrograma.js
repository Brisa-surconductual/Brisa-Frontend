import { apiClient } from '@/shared/utils/apiClient.jsx';

export async function obtenerEstadisticasPrograma({ signal } = {}) {
  const { data } = await apiClient.get('/usuarios/estadisticas-programa', {
    signal,
    timeout: 30000,
  });
  const counters = [
    data?.estudiantesActivos,
    data?.conRegistroCompleto,
    data?.conRegistroPendiente,
  ];
  const validCount = (value) => Number.isSafeInteger(value) && value >= 0;
  if (
    !counters.every(validCount) ||
    data.conRegistroCompleto + data.conRegistroPendiente !==
      data.estudiantesActivos ||
    (data.diasCronogramaBase !== null && !validCount(data.diasCronogramaBase))
  ) {
    throw new Error('La respuesta de estadísticas del programa no es válida.');
  }
  return data;
}
