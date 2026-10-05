import {CRONOGRAMA} from '../../../../shared/utils/constans'
import {apiClient} from '../../../../shared/utils/apiClient';

export const annularAdministrativeBreak = async (idUsuario, idPausa) => {
    const {data}  = await apiClient.patch(`${CRONOGRAMA}/usuarios/${idUsuario}/pausas-administrativas/${idPausa}/anular`);
    return data;
}