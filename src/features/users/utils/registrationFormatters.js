import {
  ACADEMIC_LEVEL_OPTIONS,
  CONSUMPTION_REASON_OPTIONS,
} from '../types/baselineCatalogs.js';

function findOptionLabel(options, value) {
  return (
    options.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function formatAcademicLevel(value) {
  return findOptionLabel(
    ACADEMIC_LEVEL_OPTIONS,
    value,
  );
}

export function formatConsumptionReason(value) {
  return findOptionLabel(
    CONSUMPTION_REASON_OPTIONS,
    value,
  );
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function formatConsumptionFrequency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  if (numericValue === 0) {
    return 'Actualmente no consume';
  }

  if (numericValue === 1) {
    return '1 vez al día';
  }

  return `${numericValue} veces al día`;
}