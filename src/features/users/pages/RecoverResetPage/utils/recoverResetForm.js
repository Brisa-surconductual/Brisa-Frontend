export const INITIAL_RECOVER_RESET_FORM = Object.freeze({
  code: '',
  password: '',
  confirmPassword: '',
});

/*
 * Vigencia máxima del código de recuperación según RF-07.
 * El backend sigue siendo la fuente de verdad para determinar
 * si un código está vigente, expirado o ya fue utilizado.
 */
export const RECOVERY_CODE_TTL_MS = 15 * 60 * 1000;

/*
 * A partir de este umbral restante el conteo se marca
 * como advertencia (mismo comportamiento del prototipo).
 */
export const RECOVERY_CODE_WARNING_THRESHOLD_MS = 30 * 1000;

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
