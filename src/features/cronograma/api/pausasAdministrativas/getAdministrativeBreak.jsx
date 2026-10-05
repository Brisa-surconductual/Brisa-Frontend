import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';

export const getAdministrativeBreak = async () => {
    const {data}  = await apiClient.get(`${CRONOGRAMA}/obtener-pausas-administrativas`);
    return data;
}