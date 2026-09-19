const DATE_TIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function parseDateTimeLocal(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = DATE_TIME_LOCAL_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = '0'] = match;

  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  const isValid =
    parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day) &&
    parsedDate.getHours() === Number(hour) &&
    parsedDate.getMinutes() === Number(minute) &&
    parsedDate.getSeconds() === Number(second);

  return isValid ? parsedDate.getTime() : null;
}

export function validateScheduledContentAvailabilityForm(form) {
  const errors = {};

  const availableFrom = form.availableFrom?.trim() ?? '';
  const availableUntil = form.availableUntil?.trim() ?? '';

  const availableFromTimestamp = parseDateTimeLocal(availableFrom);
  const availableUntilTimestamp = parseDateTimeLocal(availableUntil);

  if (!availableFrom) {
    errors.availableFrom = 'La fecha y hora de inicio son obligatorias.';
  } else if (availableFromTimestamp === null) {
    errors.availableFrom = 'Ingresa una fecha y hora de inicio válidas.';
  }

  if (!availableUntil) {
    errors.availableUntil = 'La fecha y hora de fin son obligatorias.';
  } else if (availableUntilTimestamp === null) {
    errors.availableUntil = 'Ingresa una fecha y hora de fin válidas.';
  }

  if (
    availableFromTimestamp !== null &&
    availableUntilTimestamp !== null &&
    availableFromTimestamp >= availableUntilTimestamp
  ) {
    errors.availableUntil =
      'La fecha de inicio debe ser anterior a la fecha de fin.';
  }

  return errors;
}

export function hasScheduledContentAvailabilityFormErrors(errors) {
  return Object.keys(errors).length > 0;
}
