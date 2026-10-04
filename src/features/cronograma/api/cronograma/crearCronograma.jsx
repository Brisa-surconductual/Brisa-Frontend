import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';


export const crearCronograma = async (cronograma) => {
    const { data } = await apiClient.post(`${CRONOGRAMA}/crear-cronograma`, cronograma);
    return data;

}