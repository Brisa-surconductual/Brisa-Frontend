export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function focusFirstInvalidField(errors) {
  const firstInvalidField = Object.keys(errors)[0];

  if (!firstInvalidField) {
    return;
  }

  requestAnimationFrame(() => {
    document
      .getElementById(firstInvalidField)
      ?.focus();
  });
}

export function clearFieldErrors(
  currentErrors,
  fieldName,
) {
  const nextErrors = {
    ...currentErrors,
  };

  delete nextErrors[fieldName];

  if (
    fieldName === 'consumptionStartDate' ||
    fieldName === 'lastConsumptionDate'
  ) {
    delete nextErrors.lastConsumptionDate;
  }

  return nextErrors;
}