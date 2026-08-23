import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';


export const sesionActual = async (usuario) => {

    const {data} = await apiClient.get(
            `${USUARIOS}/sesion/actual`
        )

    return data;
   
}