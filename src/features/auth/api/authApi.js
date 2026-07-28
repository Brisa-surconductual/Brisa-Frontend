import { AUTH_API_ERROR } from '@/features/auth/types/authTypes.js';

import {
  findAccount,
  isValidRecoveryCode,
} from '@/features/auth/api/authMockStore.js';

import {
  createApiError,
  simulateNetworkDelay,
} from '@/features/auth/api/authApiUtils.js';

export async function login({ email, password }) {
  await simulateNetworkDelay();

  const normalizedEmail = email.trim().toLowerCase();

  const account = findAccount(normalizedEmail);

  if (!account || account.password !== password) {
    throw createApiError(
      'Correo o contraseña incorrectos.',
      AUTH_API_ERROR.INVALID_CREDENTIALS,
    );
  }

  return {
    email: normalizedEmail,
    role: account.role,
  };
}

export async function requestPasswordRecovery({ email }) {
  await simulateNetworkDelay();

  /*
   * Respuesta neutra por seguridad: no se revela
   * si el correo existe o no en el sistema.
   */
  void email;

  return { requested: true };
}

export async function resetPassword({ code, password }) {
  await simulateNetworkDelay();

  if (!isValidRecoveryCode(code)) {
    throw createApiError(
      'El código de recuperación no es válido.',
      AUTH_API_ERROR.INVALID_RECOVERY_CODE,
    );
  }

  /*
   * En la implementación real la nueva contraseña
   * se envía al backend. El mock no la almacena.
   */
  void password;

  return { reset: true };
}
