import { validateBaselineForm } from '../../services/baselineValidation.js';

import {
  getProvisionalAccount,
} from './registrationMockStore.js';

const MOCK_DELAY = 500;

export const REGISTRATION_API_ERROR =
  Object.freeze({
    EMAIL_ALREADY_EXISTS:
      'EMAIL_ALREADY_EXISTS',

    PROVISIONAL_ACCOUNT_NOT_FOUND:
      'PROVISIONAL_ACCOUNT_NOT_FOUND',

    CONSENT_REQUIRED:
      'CONSENT_REQUIRED',

    CONSENT_NOT_VALID:
      'CONSENT_NOT_VALID',

    INVALID_BASELINE:
      'INVALID_BASELINE',

    BASELINE_NOT_FOUND:
      'BASELINE_NOT_FOUND',

    INCOMPLETE_DATA:
      'INCOMPLETE_DATA',
  });

export function simulateNetworkDelay() {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, MOCK_DELAY);
  });
}

export function createApiError(
  message,
  code,
  details = {},
) {
  const error = new Error(message);

  error.code = code;

  Object.assign(error, details);

  return error;
}

export function getRequiredProvisionalAccount(
  userId,
) {
  const account =
    getProvisionalAccount(userId);

  if (!account) {
    throw createApiError(
      'La cuenta provisional no existe.',
      REGISTRATION_API_ERROR
        .PROVISIONAL_ACCOUNT_NOT_FOUND,
    );
  }

  return account;
}

export function validateBaselineOrThrow(
  baseline,
  message,
) {
  const validationErrors =
    validateBaselineForm(baseline);

  if (
    Object.keys(validationErrors).length === 0
  ) {
    return;
  }

  throw createApiError(
    message,
    REGISTRATION_API_ERROR.INVALID_BASELINE,
    {
      validationErrors,
    },
  );
}

export function normalizeBaselineValues(
  baseline,
) {
  return {
    ...baseline,
    age: Number(baseline.age),
    semester: Number(baseline.semester),
    consumptionFrequency: Number(
      baseline.consumptionFrequency,
    ),
  };
}

export function createTimestamp() {
  return new Date().toISOString();
}