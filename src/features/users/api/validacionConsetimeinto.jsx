import {USUARIOS} from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';

export const validarConsentimiento = async (payload) => {
    const { data } = await apiClient.post(`${USUARIOS}/actualizar-consentimiento`, payload);
    return data;
}