import {
  getModifiedFields,
  hasSensitiveChanges,
} from '../services/registrationReview.js';

import { validateBaselineForm } from '../services/baselineValidation.js';

const MOCK_DELAY = 500;

const PROVISIONAL_ACCOUNTS = new Map();

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function createApiError(message, code) {
  const error = new Error(message);
  error.code = code;

  return error;
}

export async function createAccount({
  email,
  password,
}) {
  await delay(MOCK_DELAY);

  const normalizedEmail = email.trim().toLowerCase();

  const duplicatedInMock =
    normalizedEmail === 'registrado@brisa.co';

  const duplicatedInRuntime = Array.from(
    PROVISIONAL_ACCOUNTS.values(),
  ).some((account) => account.email === normalizedEmail);

  if (duplicatedInMock || duplicatedInRuntime) {
    throw createApiError(
      'El correo ya se encuentra registrado.',
      'EMAIL_ALREADY_EXISTS',
    );
  }

  /*
   * La contraseña se recibiría únicamente para enviarla al backend.
   * No se guarda en memoria global, localStorage ni sessionStorage.
   */
  void password;

  const account = {
    userId: crypto.randomUUID(),
    email: normalizedEmail,
    registrationStatus: 'PENDIENTE_CONSENTIMIENTO',
  };

  PROVISIONAL_ACCOUNTS.set(account.userId, {
    ...account,
    consent: null,
  });

  return account;
}

export async function acceptConsent({
  userId,
  personalDataAccepted,
  consumptionHistoryAccepted,
  consentVersion,
}) {
  await delay(MOCK_DELAY);

  const provisionalAccount = PROVISIONAL_ACCOUNTS.get(userId);

  if (!provisionalAccount) {
    throw createApiError(
      'La cuenta provisional no existe.',
      'PROVISIONAL_ACCOUNT_NOT_FOUND',
    );
  }

  if (!personalDataAccepted || !consumptionHistoryAccepted) {
    throw createApiError(
      'Ambas autorizaciones son obligatorias.',
      'CONSENT_REQUIRED',
    );
  }

  const consent = {
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion,
    status: 'VIGENTE',
    acceptedAt: new Date().toISOString(),
  };

  PROVISIONAL_ACCOUNTS.set(userId, {
    ...provisionalAccount,
    consent,
  });

  return {
    ...consent,
  };
}

export async function deleteProvisionalAccount({
  userId,
}) {
  await delay(MOCK_DELAY);

  /*
   * La eliminación es idempotente en este mock:
   * si la cuenta ya no existe, la operación se considera terminada.
   */
  PROVISIONAL_ACCOUNTS.delete(userId);

  return {
    deleted: true,
  };
}

export async function saveBaselineData({
  userId,
  baseline,
}) {
  await delay(MOCK_DELAY);

  const validationErrors = validateBaselineForm(baseline);

  if (Object.keys(validationErrors).length > 0) {
    const error = createApiError(
      'Los datos de línea base no son válidos.',
      'INVALID_BASELINE',
    );

    error.validationErrors = validationErrors;

    throw error;
  }

  const provisionalAccount =
    PROVISIONAL_ACCOUNTS.get(userId);

  if (!provisionalAccount) {
    throw createApiError(
      'La cuenta provisional no existe.',
      'PROVISIONAL_ACCOUNT_NOT_FOUND',
    );
  }

  if (!provisionalAccount.consent) {
    throw createApiError(
      'El consentimiento todavía no ha sido registrado.',
      'CONSENT_REQUIRED',
    );
  }

  const savedBaseline = {
    ...baseline,
    age: Number(baseline.age),
    semester: Number(baseline.semester),
    consumptionFrequency: Number(
      baseline.consumptionFrequency,
    ),
    savedAt: new Date().toISOString(),
  };

  PROVISIONAL_ACCOUNTS.set(userId, {
    ...provisionalAccount,
    baseline: savedBaseline,
    registrationStatus: 'PENDIENTE_REVISION',
  });

  return {
    baseline: savedBaseline,
    registrationStatus: 'PENDIENTE_REVISION',
  };
}

export async function updateRegistrationData({
  userId,
  baseline,
}) {
  await delay(MOCK_DELAY);

  const validationErrors = validateBaselineForm(baseline);

  if (Object.keys(validationErrors).length > 0) {
    const error = createApiError(
      'Los datos actualizados no son válidos.',
      'INVALID_BASELINE',
    );

    error.validationErrors = validationErrors;

    throw error;
  }

  const provisionalAccount =
    PROVISIONAL_ACCOUNTS.get(userId);

  if (!provisionalAccount) {
    throw createApiError(
      'La cuenta provisional no existe.',
      'PROVISIONAL_ACCOUNT_NOT_FOUND',
    );
  }

  if (!provisionalAccount.baseline) {
    throw createApiError(
      'La línea base todavía no ha sido registrada.',
      'BASELINE_NOT_FOUND',
    );
  }

  const normalizedBaseline = {
    ...baseline,
    age: Number(baseline.age),
    semester: Number(baseline.semester),
    consumptionFrequency: Number(
      baseline.consumptionFrequency,
    ),
    updatedAt: new Date().toISOString(),
  };

  const modifiedFields = getModifiedFields(
    provisionalAccount.baseline,
    normalizedBaseline,
  );

  const sensitiveChanges =
    hasSensitiveChanges(modifiedFields);

  const nextConsent = provisionalAccount.consent
    ? {
        ...provisionalAccount.consent,
        status: sensitiveChanges
          ? 'NO_VIGENTE'
          : provisionalAccount.consent.status,
      }
    : null;

  PROVISIONAL_ACCOUNTS.set(userId, {
    ...provisionalAccount,
    baseline: normalizedBaseline,
    consent: nextConsent,
    modifiedFields,
    registrationStatus: 'PENDIENTE_REVISION',
  });

  return {
    baseline: normalizedBaseline,
    modifiedFields,
    consentIsValid:
      nextConsent?.status === 'VIGENTE',
    registrationStatus: 'PENDIENTE_REVISION',
  };
}

export async function renewRegistrationConsent({
  userId,
  personalDataAccepted,
  consumptionHistoryAccepted,
  consentVersion,
}) {
  await delay(MOCK_DELAY);

  const provisionalAccount =
    PROVISIONAL_ACCOUNTS.get(userId);

  if (!provisionalAccount) {
    throw createApiError(
      'La cuenta provisional no existe.',
      'PROVISIONAL_ACCOUNT_NOT_FOUND',
    );
  }

  if (
    !personalDataAccepted ||
    !consumptionHistoryAccepted
  ) {
    throw createApiError(
      'Ambas autorizaciones son obligatorias.',
      'CONSENT_REQUIRED',
    );
  }

  const consent = {
    personalDataAccepted,
    consumptionHistoryAccepted,
    consentVersion,
    status: 'VIGENTE',
    acceptedAt: new Date().toISOString(),
    acceptanceType: 'RECONSENTIMIENTO',
  };

  PROVISIONAL_ACCOUNTS.set(userId, {
    ...provisionalAccount,
    consent,
  });

  return consent;
}

export async function confirmRegistration({
  userId,
}) {
  await delay(MOCK_DELAY);

  const provisionalAccount =
    PROVISIONAL_ACCOUNTS.get(userId);

  if (!provisionalAccount) {
    throw createApiError(
      'La cuenta provisional no existe.',
      'PROVISIONAL_ACCOUNT_NOT_FOUND',
    );
  }

  if (!provisionalAccount.baseline) {
    throw createApiError(
      'Los datos de línea base están incompletos.',
      'INCOMPLETE_DATA',
    );
  }

  if (
    !provisionalAccount.consent ||
    provisionalAccount.consent.status !== 'VIGENTE'
  ) {
    throw createApiError(
      'El consentimiento no se encuentra vigente.',
      'CONSENT_NOT_VALID',
    );
  }

  const confirmedAt = new Date().toISOString();

  const completedAccount = {
    ...provisionalAccount,
    registrationStatus: 'REGISTRO_COMPLETO',
    confirmedAt,
  };

  PROVISIONAL_ACCOUNTS.set(
    userId,
    completedAccount,
  );

  return {
    userId,
    email: provisionalAccount.email,
    registrationStatus: 'REGISTRO_COMPLETO',
    confirmedAt,
  };
}