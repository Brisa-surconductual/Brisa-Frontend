import { CRONOGRAMA } from '../../../../shared/utils/constans';
import { apiClient } from '../../../../shared/utils/apiClient';

export const registerAdministrativeBreak = async (idUsuario, payload) => {
    const { data } = await apiClient.post(`${CRONOGRAMA}/usuarios/${idUsuario}/pausas-administrativas`, payload);
    return data;
};