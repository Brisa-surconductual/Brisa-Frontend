import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';


export const sesionActual = async ({ signal } = {}) => {

    const {data} = await apiClient.get(
            `${USUARIOS}/sesion/actual`,
            { signal },
        )

    if (data.csrfToken) {
        localStorage.setItem('csrfToken', data.csrfToken);
    }

    return data;
   
}