export const INITIAL_RECOVER_REQUEST_FORM = Object.freeze({
  email: '',
});

export function createRecoverRequestFormState() {
  return { ...INITIAL_RECOVER_REQUEST_FORM };
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
  const nextErrors = { ...currentErrors };

  delete nextErrors[fieldName];

  return nextErrors;
}
