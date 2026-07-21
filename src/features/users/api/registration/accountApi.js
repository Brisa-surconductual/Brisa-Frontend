import {
  REGISTRATION_STATUS,
} from '../../types/registrationStatus.js';

import {
  deleteStoredProvisionalAccount,
  emailExists,
  setProvisionalAccount,
} from './registrationMockStore.js';

import {
  createApiError,
  REGISTRATION_API_ERROR,
  simulateNetworkDelay,
} from './registrationApiUtils.js';

export async function createAccount({
  email,
  password,
}) {
  await simulateNetworkDelay();

  const normalizedEmail =
    email.trim().toLowerCase();

  if (emailExists(normalizedEmail)) {
    throw createApiError(
      'El correo ya se encuentra registrado.',
      REGISTRATION_API_ERROR
        .EMAIL_ALREADY_EXISTS,
    );
  }

  /*
   * En la implementación real, la contraseña se
   * enviará al backend. El mock no la almacena.
   */
  void password;

  const account = {
    userId: crypto.randomUUID(),
    email: normalizedEmail,
    registrationStatus:
      REGISTRATION_STATUS.PENDING_CONSENT,
  };

  setProvisionalAccount(account.userId, {
    ...account,
    consent: null,
    baseline: null,
    modifiedFields: [],
  });

  return account;
}

export async function deleteProvisionalAccount({
  userId,
}) {
  await simulateNetworkDelay();

  /*
   * La eliminación es idempotente: si la cuenta
   * ya no existe, se considera eliminada.
   */
  deleteStoredProvisionalAccount(userId);

  return {
    deleted: true,
  };
}