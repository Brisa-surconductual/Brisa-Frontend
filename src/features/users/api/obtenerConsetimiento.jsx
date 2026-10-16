import { USUARIOS } from '../../../shared/utils/constans.jsx';
import {apiClient} from '../../../shared/utils/apiClient.jsx';


export const obtenerConsentimiento = async () => {
    const { data } = await apiClient.get(`${USUARIOS}/consetimeinto-vigente`);
    return data;
}