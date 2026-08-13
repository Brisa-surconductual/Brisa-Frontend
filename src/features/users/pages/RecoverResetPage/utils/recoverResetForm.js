export const INITIAL_RECOVER_RESET_FORM = Object.freeze({
  code: '',
  password: '',
  confirmPassword: '',
});

const MINUTE_MS = 60 * 1000;

export const RECOVERY_CODE_TTL_MS =
  15 * MINUTE_MS;

export const RECOVERY_CODE_WARNING_THRESHOLD_MS =
  2 * MINUTE_MS;

export function formatRecoveryCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function createRecoverResetFormState() {
  return { ...INITIAL_RECOVER_RESET_FORM };
}

export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function focusField(fieldId) {
  requestAnimationFrame(() => {
    document.getElementById(fieldId)?.focus();
  });
}

export function focusFirstInvalidField(errors) {
  const firstInvalidField = Object.keys(errors)[0];

  if (!firstInvalidField) {
    return;
  }

  focusField(firstInvalidField);
}

export function clearFieldErrors(currentErrors, fieldName) {
  const fieldsToClear =
    fieldName === 'password' ? ['password', 'confirmPassword'] : [fieldName];

  const hasErrorsToClear = fieldsToClear.some((field) => currentErrors[field]);

  if (!hasErrorsToClear) {
    return currentErrors;
  }

  const nextErrors = { ...currentErrors };

  fieldsToClear.forEach((field) => {
    delete nextErrors[field];
  });

  return nextErrors;
}
