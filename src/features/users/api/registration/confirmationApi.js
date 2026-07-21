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
      REGISTRATION_API_ERROR.CONSENT_NOT_VALID,
    );
  }

  const confirmedAt = createTimestamp();

  const completedAccount = {
    ...provisionalAccount,
    registrationStatus:
      REGISTRATION_STATUS.COMPLETED,
    confirmedAt,
  };

  setProvisionalAccount(
    userId,
    completedAccount,
  );

  return {
    userId,
    email: provisionalAccount.email,
    registrationStatus:
      REGISTRATION_STATUS.COMPLETED,
    confirmedAt,
  };
}