export const INITIAL_ACCOUNT_FORM =
  Object.freeze({
    email: '',
    password: '',
    confirmPassword: '',
  });

export function createAccountFormState() {
  return {
    ...INITIAL_ACCOUNT_FORM,
  };
}

export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function focusField(fieldId) {
  requestAnimationFrame(() => {
    document
      .getElementById(fieldId)
      ?.focus();
  });
}

export function focusFirstInvalidField(errors) {
  const firstInvalidField =
    Object.keys(errors)[0];

  if (!firstInvalidField) {
    return;
  }

  focusField(firstInvalidField);
}

export function clearAccountFieldErrors(
  currentErrors,
  fieldName,
) {
  const fieldsToClear =
    fieldName === 'password'
      ? ['password', 'confirmPassword']
      : [fieldName];

  const hasErrorsToClear =
    fieldsToClear.some(
      (field) => currentErrors[field],
    );

  if (!hasErrorsToClear) {
    return currentErrors;
  }

  const nextErrors = {
    ...currentErrors,
  };

  fieldsToClear.forEach((field) => {
    delete nextErrors[field];
  });

  return nextErrors;
}