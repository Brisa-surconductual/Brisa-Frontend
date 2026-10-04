import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';

export const listSchedule = async () => {
    const { data } = await apiClient.get(`${CRONOGRAMA}/obtener-cronogramas`);
    return data;
} 