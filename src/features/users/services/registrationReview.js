import {
  BASELINE_FIELD_LABELS,
  SENSITIVE_BASELINE_FIELDS,
} from '../types/registrationFields.js';

export function getModifiedFields(originalData, updatedData) {
  if (!originalData || !updatedData) {
    return [];
  }

  return Object.keys(BASELINE_FIELD_LABELS).filter((field) => {
    const originalValue = String(originalData[field] ?? '');
    const updatedValue = String(updatedData[field] ?? '');

    return originalValue !== updatedValue;
  });
}

export function getSensitiveModifiedFields(modifiedFields = []) {
  return modifiedFields.filter((field) =>
    SENSITIVE_BASELINE_FIELDS.has(field),
  );
}

export function hasSensitiveChanges(modifiedFields = []) {
  return getSensitiveModifiedFields(modifiedFields).length > 0;
}

export function getModifiedFieldLabels(modifiedFields = []) {
  return modifiedFields.map(
    (field) => BASELINE_FIELD_LABELS[field] ?? field,
  );
}