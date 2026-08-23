import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';


export const registroUsuario = async (usuario) => {
  try {
    const response = await apiClient.post(
      `${USUARIOS}/crear/estudiante`,
      usuario,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};