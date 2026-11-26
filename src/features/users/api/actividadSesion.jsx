import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';

/*
 * POST /usuarios/sesion/actividad. Requiere cookie y X-CSRF-Token.
 * Actualiza la última interacción de la sesión en el backend; no
 * renueva la cookie (su vida absoluta la fija el inicio de sesión).
 */
export const registrarActividadSesion = async ({
  estadoAplicacion,
  signal,
} = {}) => {
  const { data } = await apiClient.post(
    `${USUARIOS}/sesion/actividad`,
    { estadoAplicacion },
    { signal },
  );

  return data;
};
