import { parseDateOnly } from '@/shared/utils/dateUtils.js';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatScheduleDate(value) {
  const timestamp = parseDateOnly(value);

  if (timestamp === null) {
    return null;
  }

  return DATE_FORMATTER.format(new Date(timestamp));
}

export function formatScheduleDateRange(startDate, endDate) {
  const formattedStartDate = formatScheduleDate(startDate);
  const formattedEndDate = formatScheduleDate(endDate);

  if (!formattedStartDate || !formattedEndDate) {
    return 'Por definir';
  }

  return `${formattedStartDate} - ${formattedEndDate}`;
}