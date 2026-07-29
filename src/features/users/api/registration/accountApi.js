import {
  authAccountExists,
} from '@/features/auth/api/authMockStore.js';

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

  const emailIsAlreadyRegistered =
    emailExists(normalizedEmail) ||
    authAccountExists(normalizedEmail);

  if (emailIsAlreadyRegistered) {
    throw createApiError(
      'El correo ya se encuentra registrado.',
      REGISTRATION_API_ERROR
        .EMAIL_ALREADY_EXISTS,
    );
  }

  const account = {
    userId: crypto.randomUUID(),
    email: normalizedEmail,
    registrationStatus:
      REGISTRATION_STATUS.PENDING_CONSENT,
  };

  /*
   * La contraseña se almacena únicamente dentro
   * del mock provisional para poder simular la
   * creación posterior de una cuenta autenticable.
   *
   * No se retorna al componente ni se almacena en
   * RegistrationContext.
   */
  setProvisionalAccount(account.userId, {
    ...account,
    password,
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