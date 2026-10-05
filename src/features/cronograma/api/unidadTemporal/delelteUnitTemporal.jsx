import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';


export const deleteUnitTemporal = async (idUnidadTemporal) => {
    const {data} = await apiClient.delete(`${CRONOGRAMA}/eliminar-unidad-temporal`, {
        data: { idUnidadTemporal }
    });
    return data;
}