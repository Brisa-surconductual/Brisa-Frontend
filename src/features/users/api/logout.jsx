import {USUARIOS} from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';

// `signal` permite abortar la solicitud: una respuesta tardía no
// debe borrar la cookie ni el CSRF de una sesión posterior.
export const cerrarSesion = async ({ signal } = {}) => {
    const { data } = await apiClient.post(`${USUARIOS}/cerrar-sesion`, null, {
        signal,
    });
    localStorage.removeItem('csrfToken');
    return data;
}
