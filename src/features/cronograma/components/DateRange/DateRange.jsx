import { formatScheduleDate } from '@/features/cronograma/utils/scheduleDateUtils.js';

/**
 * Rango de fechas del cronograma.
 *
 * Reusa formatScheduleDate (es-CO, "02 jun 2026"), que solo acepta ISO
 * date-only: cualquier otra cosa cae en emptyLabel, el mismo texto que ya
 * devuelve formatScheduleDateRange para no divergir.
 *
 * Sin endDate muestra una sola fecha, que es el caso de la disponibilidad de
 * un contenido concreto.
 *
 * Se emiten dos <time> y no uno: un rango no es un valor válido de datetime.
 */
export function DateRange({ startDate, endDate, emptyLabel = 'Por definir' }) {
  const start = formatScheduleDate(startDate);
  const end = formatScheduleDate(endDate);

  if (!start) {
    return <span>{emptyLabel}</span>;
  }

  if (!endDate) {
    return <time dateTime={startDate}>{start}</time>;
  }

  if (!end) {
    return <span>{emptyLabel}</span>;
  }

  return (
    <span>
      <time dateTime={startDate}>{start}</time>
      {' - '}
      <time dateTime={endDate}>{end}</time>
    </span>
  );
}
