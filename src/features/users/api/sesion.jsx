import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';


export const sesionActual = async () => {

    const {data} = await apiClient.get(
            `${USUARIOS}/sesion/actual`
        )

    if (data.csrfToken) {
        localStorage.setItem('csrfToken', data.csrfToken);
    }

    return data;
   
}