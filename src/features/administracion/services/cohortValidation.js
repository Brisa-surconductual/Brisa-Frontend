import { parseDateOnly } from '@/shared/utils/dateUtils.js';

/*
 * Validación del formulario de cohorte (RF-124):
 * - el nombre no puede estar vacío;
 * - las fechas de inicio y de finalización del programa son
 *   obligatorias y deben ser fechas reales (YYYY-MM-DD);
 * - la fecha de finalización no puede ser anterior a la de
 *   inicio (pueden coincidir).
 *
 * Las fechas se comparan como fechas de calendario en UTC, sin
 * la hora local del navegador, para evitar desfases por zona
 * horaria. El cronograma asociado y su estado se validarán
 * cuando exista la fuente de cronogramas.
 */
export function validateCohortForm({
  name = '',
  startDate = '',
  endDate = '',
}) {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'El nombre de la cohorte es obligatorio.';
  }

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!startDate) {
    errors.startDate = 'La fecha de inicio del programa es obligatoria.';
  } else if (start === null) {
    errors.startDate = 'Ingresa una fecha de inicio válida.';
  }

  if (!endDate) {
    errors.endDate = 'La fecha de finalización del programa es obligatoria.';
  } else if (end === null) {
    errors.endDate = 'Ingresa una fecha de finalización válida.';
  } else if (start !== null && end < start) {
    errors.endDate =
      'La fecha de finalización del programa no puede ser anterior a la fecha de inicio.';
  }

  return errors;
}
