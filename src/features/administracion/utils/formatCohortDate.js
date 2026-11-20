import { parseDateOnly } from '@/shared/utils/dateUtils.js';

// Fecha de calendario (YYYY-MM-DD) formateada en UTC: el día que
// se muestra es el mismo que se registró, sin desfase horario.
const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatCohortDate(value) {
  const timestamp = parseDateOnly(value);

  return timestamp === null ? null : DATE_FORMATTER.format(timestamp);
}
