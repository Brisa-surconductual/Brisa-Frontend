import {
  getModifiedFields,
  hasSensitiveChanges,
} from '../../services/registrationReview.js';

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
  normalizeBaselineValues,
  REGISTRATION_API_ERROR,
  simulateNetworkDelay,
  validateBaselineOrThrow,
} from './registrationApiUtils.js';

export async function saveBaselineData({
  userId,
  baseline,
}) {
  await simulateNetworkDelay();

  validateBaselineOrThrow(
    baseline,
    'Los datos de línea base no son válidos.',
  );

  const provisionalAccount =
    getRequiredProvisionalAccount(userId);

  if (!provisionalAccount.consent) {
    throw createApiError(
      'El consentimiento todavía no ha sido registrado.',
      REGISTRATION_API_ERROR.CONSENT_REQUIRED,
    );
  }

  const savedBaseline = {
    ...normalizeBaselineValues(baseline),
    savedAt: createTimestamp(),
  };

  setProvisionalAccount(userId, {
    ...provisionalAccount,
    baseline: savedBaseline,
    registrationStatus:
      REGISTRATION_STATUS.PENDING_REVIEW,
  });

  return {
    baseline: savedBaseline,
    registrationStatus:
      REGISTRATION_STATUS.PENDING_REVIEW,
  };
}

export async function updateRegistrationData({
  userId,
  baseline,
}) {
  await simulateNetworkDelay();

  validateBaselineOrThrow(
    baseline,
    'Los datos actualizados no son válidos.',
  );

  const provisionalAccount =
    getRequiredProvisionalAccount(userId);

  if (!provisionalAccount.baseline) {
    throw createApiError(
      'La línea base todavía no ha sido registrada.',
      REGISTRATION_API_ERROR.BASELINE_NOT_FOUND,
    );
  }

  const normalizedBaseline = {
    ...normalizeBaselineValues(baseline),
    updatedAt: createTimestamp(),
  };

  const modifiedFields = getModifiedFields(
    provisionalAccount.baseline,
    normalizedBaseline,
  );

  const sensitiveChanges =
    hasSensitiveChanges(modifiedFields);

  const nextConsent =
    provisionalAccount.consent
      ? {
          ...provisionalAccount.consent,

          status: sensitiveChanges
            ? CONSENT_STATUS.INVALID
            : provisionalAccount.consent.status,
        }
      : null;

  setProvisionalAccount(userId, {
    ...provisionalAccount,
    baseline: normalizedBaseline,
    consent: nextConsent,
    modifiedFields,
    registrationStatus:
      REGISTRATION_STATUS.PENDING_REVIEW,
  });

  return {
    baseline: normalizedBaseline,
    modifiedFields,

    consentIsValid:
      nextConsent?.status ===
      CONSENT_STATUS.VALID,

    registrationStatus:
      REGISTRATION_STATUS.PENDING_REVIEW,
  };
}