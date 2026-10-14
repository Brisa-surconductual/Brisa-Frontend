import { CRONOGRAMA } from '../../../../shared/utils/constans';
import { apiClient } from '../../../../shared/utils/apiClient';

export const getTemporalLocations = async (filtros = {}) => {
  try {
    const { data } = await apiClient.get(`${CRONOGRAMA}/ubicaciones-temporales`, {
      params: {
        page: filtros.page || 1,
        page_size: filtros.pageSize || 50,
        fecha_calculo: filtros.fechaCalculo, 
        id_usuario: filtros.idUsuario,       
        id_cronograma: filtros.idCronograma, 
      },
    });
    
    return data; 
  } catch (error) {
    console.error("Error en Axios al consultar ubicaciones:", error.response?.data || error.message);
    throw error;
  }
};