import { CRONOGRAMA } from '../../../../shared/utils/constans';
import { apiClient } from '../../../../shared/utils/apiClient';

export const getTemporalInformationByUser = async (idUsuario) => {
  const { data } = await apiClient.get(
    `${CRONOGRAMA}/participantes/${idUsuario}/informacion-temporal`
  );
  return data;
}; 