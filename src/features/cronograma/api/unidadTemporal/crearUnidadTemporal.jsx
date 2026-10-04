import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';

export const crearUnidadTemporal = async (unidadTemporal) => {
    try{
        const { data } = await apiClient.post(`${CRONOGRAMA}/unidades-temporales`, unidadTemporal);
        return data;

    }catch (error) {
        throw error;
    }
}