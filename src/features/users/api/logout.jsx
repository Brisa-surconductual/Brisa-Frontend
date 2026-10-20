import {USUARIOS} from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';

export const cerrarSesion = async () => {
    const { data } = await apiClient.post(`${USUARIOS}/cerrar-sesion`);
    localStorage.removeItem('csrfToken');
    return data;
}
