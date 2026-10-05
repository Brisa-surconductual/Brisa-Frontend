import { USUARIOS } from '../../../../shared/utils/constans';
import { apiClient } from '../../../../shared/utils/apiClient';

export const searchStudents = async (searchTerm) => {
    const { data } = await apiClient.get(`${USUARIOS}/buscar`, {
        params: {
            q: searchTerm, 
        },
    });
    
    return data;
};