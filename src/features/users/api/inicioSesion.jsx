import {USUARIOS} from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';

export const iniciarSesion = async ({ email, password }) => {
    const { data } = await apiClient.post( `${USUARIOS}/iniciar-sesion`, {
        correoElectronico: email.trim(),
        contrasena: password,
    });
    
    return data;
};