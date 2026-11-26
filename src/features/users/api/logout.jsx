import {USUARIOS} from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';

// `signal` permite abortar la solicitud: una respuesta tardía no
// debe borrar la cookie ni el CSRF de una sesión posterior.
// El cuerpo es `{}` y no `null`: con `Content-Type: application/json`
// axios envía el texto "null", que el parser estricto del backend
// rechaza con 400 antes de llegar al cierre.
export const cerrarSesion = async ({ signal } = {}) => {
    const { data } = await apiClient.post(`${USUARIOS}/cerrar-sesion`, {}, {
        signal,
    });
    localStorage.removeItem('csrfToken');
    return data;
}
