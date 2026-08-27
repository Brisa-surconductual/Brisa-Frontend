import { USUARIOS } from '../../../shared/utils/constans.jsx';
import { apiClient } from '../../../shared/utils/apiClient.jsx';

export const solicitarRecuperacionContrasena = async ({ email }) => {
  const { data } = await apiClient.post(
    `${USUARIOS}/envio-codigo-recuperacion`,
    {
      correoElectronico: email.trim(),
    },
  );

  return data;
};

export const actualizarContrasena = async ({ code, password }) => {
  const { data } = await apiClient.post(
    `${USUARIOS}/actualizar-contrasena`,
    {
      codigo: code.trim(),
      nuevaContrasena: password,
    },
  );

  return data;
};