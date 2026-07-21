import {
  CONSENT_ACCEPTANCE_TYPE,
  CONSENT_STATUS,
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

function validateConsentSelections({
  personalDataAccepted,
  consumptionHistoryAccepted,
}) {
  if (
    personalDataAccepted &&
    consumptionHistoryAccepted
  ) {
    return;
  }

  throw createApiError(
    'Ambas autorizaciones son obligatorias.',
    REGISTRATION_API_ERROR.CONSENT_REQUIRED,
  );
}

function createConsentRecord({
  personalDataAccepted,
  consumptionHistoryAccepted,
  consentVersion,
  acceptanceType,
}) {
  return {
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion,
    status: CONSENT_STATUS.VALID,
    acceptedAt: createTimestamp(),

    ...(acceptanceType
      ? { acceptanceType }
      : {}),
  };
}

async function saveConsent({
  userId,
  personalDataAccepted,
  consumptionHistoryAccepted,
  consentVersion,
  acceptanceType,
}) {
  await simulateNetworkDelay();

  const provisionalAccount =
    getRequiredProvisionalAccount(userId);

  validateConsentSelections({
    personalDataAccepted,
    consumptionHistoryAccepted,
  });

  const consent = createConsentRecord({
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion,
    acceptanceType,
  });

  setProvisionalAccount(userId, {
    ...provisionalAccount,
    consent,
  });

  return {
    ...consent,
  };
}

export function acceptConsent({
  userId,
  personalDataAccepted,
  consumptionHistoryAccepted,
  consentVersion,
}) {
  return saveConsent({
    userId,
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion,
  });
}

export function renewRegistrationConsent({
  userId,
  personalDataAccepted,
  consumptionHistoryAccepted,
  consentVersion,
}) {
  return saveConsent({
    userId,
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion,
    acceptanceType:
      CONSENT_ACCEPTANCE_TYPE.RENEWAL,
  });
}