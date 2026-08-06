import {
  registerAuthAccount,
} from '@/features/users/api/auth/authMockStore.js';

import {
  USER_ROLE,
} from '@/features/users/types/authTypes.js';

import {
  CONSENT_STATUS,
  REGISTRATION_STATUS,
} from '../../types/registrationStatus.js';

import {
  setProvisionalAccount,
} from './registrationMockStore.js';

import {
  createApiError,
  createTimestamp,
  getRequiredProvisionalAccount,
  REGISTRATION_API_ERROR,
  simulateNetworkDelay,
} from './registrationApiUtils.js';

export async function confirmRegistration({
  userId,
}) {
  await simulateNetworkDelay();

  const provisionalAccount =
    getRequiredProvisionalAccount(userId);

  if (!provisionalAccount.baseline) {
    throw createApiError(
      'Los datos de línea base están incompletos.',
      REGISTRATION_API_ERROR.INCOMPLETE_DATA,
    );
  }

  if (
    !provisionalAccount.consent ||
    provisionalAccount.consent.status !==
      CONSENT_STATUS.VALID
  ) {
    throw createApiError(
      'El consentimiento no se encuentra vigente.',
      REGISTRATION_API_ERROR
        .CONSENT_NOT_VALID,
    );
  }

  if (!provisionalAccount.password) {
    throw createApiError(
      'No se encontraron las credenciales de la cuenta provisional.',
      REGISTRATION_API_ERROR.INCOMPLETE_DATA,
    );
  }

  const confirmedAt = createTimestamp();

  /*
   * La contraseña se extrae antes de construir la
   * cuenta completada para evitar conservarla en
   * el almacén del proceso de registro.
   */
  const {
    password,
    ...provisionalAccountWithoutPassword
  } = provisionalAccount;

  const completedAccount = {
    ...provisionalAccountWithoutPassword,

    registrationStatus:
      REGISTRATION_STATUS.COMPLETED,

    confirmedAt,
  };

  /*
   * Simula la creación definitiva de la cuenta
   * dentro del sistema de autenticación.
   */
  const session = registerAuthAccount({
    email: completedAccount.email,
    password,
    role: USER_ROLE.ESTUDIANTE,
  });

  /*
   * El registro provisional se actualiza sin
   * conservar la contraseña.
   */
  setProvisionalAccount(
    userId,
    completedAccount,
  );

  return {
    account: {
      userId,
      email: completedAccount.email,

      registrationStatus:
        REGISTRATION_STATUS.COMPLETED,

      confirmedAt,
    },

    session,
  };
}