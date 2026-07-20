const APPLICATION_TIME_ZONE = 'America/Bogota';

export function getCurrentDateInBogota(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APPLICATION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter(({ type }) =>
        ['year', 'month', 'day'].includes(type),
      )
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function parseDateOnly(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const [year, month, day] = value
    .split('-')
    .map(Number);

  const timestamp = Date.UTC(
    year,
    month - 1,
    day,
  );

  const date = new Date(timestamp);

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValid ? timestamp : null;
}