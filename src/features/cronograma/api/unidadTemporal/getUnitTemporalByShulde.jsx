import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';


export const getUnitTemporalByShulde = async (idCronograma) => {
    const data = await apiClient.get(`${CRONOGRAMA}/obtener-unidades-temporales/${idCronograma}`);
    return data;
}
