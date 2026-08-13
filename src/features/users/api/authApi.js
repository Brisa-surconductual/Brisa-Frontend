import { apiRequest } from '@/shared/api/apiClient.js';

import {
  AUTH_API_ERROR,
  USER_ROLE,
} from '@/features/users/types/authTypes.js';

import {
  apiErrorMessageIncludes,
  createApiError,
  hasApiStatus,
} from '@/features/users/api/auth/authApiUtils.js';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/*
 * El backend utiliza ADMINISTRATIVO como rol técnico,
 * mientras que el frontend actual utiliza PSICOLOGIA.
 *
 * Esta adaptación se mantiene en la frontera con la API
 * para no afectar módulos fuera del alcance actual.
 */
function mapBackendRole(role) {
  if (role === 'ESTUDIANTE') {
    return USER_ROLE.ESTUDIANTE;
  }

  if (
    role === 'ADMINISTRATIVO' ||
    role === 'ADMINISTRADOR'
  ) {
    return USER_ROLE.PSICOLOGIA;
  }

  return role;
}

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  try {
    const response = await apiRequest(
      '/usuarios/iniciar-sesion',
      {
        method: 'POST',
        body: {
          correoElectronico: normalizedEmail,
          contrasena: password,
        },
      },
    );

    return {
      idUsuario: response.idUsuario,
      email: normalizedEmail,
      role: mapBackendRole(response.rol),
      backendRole: response.rol,
      alcance: response.alcance,
      estadoRegistro: response.estadoRegistro,
      siguienteAccion: response.siguienteAccion,
      limiteInactividadMinutos:
        response.limiteInactividadMinutos,
      csrfToken: response.csrfToken,
      mensaje: response.mensaje,
    };
  } catch (error) {
    if (
      hasApiStatus(error, 400, 401, 403) ||
      apiErrorMessageIncludes(
        error,
        'credenciales',
        'contraseña',
      )
    ) {
      throw createApiError(
        'Correo o contraseña incorrectos.',
        AUTH_API_ERROR.INVALID_CREDENTIALS,
        error,
      );
    }

    throw error;
  }
}

export async function requestPasswordRecovery({ email }) {
  const normalizedEmail = normalizeEmail(email);

  return apiRequest(
    '/usuarios/envio-codigo-recuperacion',
    {
      method: 'POST',
      body: {
        correoElectronico: normalizedEmail,
      },
    },
  );
}

export async function resetPassword({
  code,
  password,
}) {
  try {
    return await apiRequest(
      '/usuarios/actualizar-contrasena',
      {
        method: 'POST',
        body: {
          codigo: code.trim(),
          nuevaContrasena: password,
        },
      },
    );
  } catch (error) {
    if (
      hasApiStatus(error, 400, 401, 404, 422) ||
      apiErrorMessageIncludes(
        error,
        'código',
        'codigo',
        'recuperación',
        'recuperacion',
        'inválido',
        'invalido',
        'expirado',
      )
    ) {
      throw createApiError(
        'El código de recuperación no es válido.',
        AUTH_API_ERROR.INVALID_RECOVERY_CODE,
        error,
      );
    }

    throw error;
  }
}