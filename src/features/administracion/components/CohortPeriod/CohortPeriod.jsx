import { formatCohortDate } from '../../utils/formatCohortDate.js';

/*
 * Periodo del programa de una cohorte (RF-124): inicio – fin. Una
 * fecha ilegible se indica como no disponible, sin inventarla.
 */
function ProgramDate({ value }) {
  const label = formatCohortDate(value);

  return label ? <time dateTime={value}>{label}</time> : 'Fecha no disponible';
}

export function CohortPeriod({ startDate, endDate }) {
  return (
    <>
      <ProgramDate value={startDate} />
      <span aria-hidden="true"> – </span>
      <span className="sr-only"> hasta </span>
      <ProgramDate value={endDate} />
    </>
  );
}
