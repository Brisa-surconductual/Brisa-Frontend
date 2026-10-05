import { CRONOGRAMA } from '../../../../shared/utils/constans';
import { apiClient } from '../../../../shared/utils/apiClient';

export const updateUnitTemporal = async (payload) => {
    const { data } = await apiClient.patch(`${CRONOGRAMA}/actualizar-unidad-temporal`, payload);
    return data;
}