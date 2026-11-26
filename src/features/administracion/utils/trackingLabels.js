import { PROGRESS_LEVEL } from '../types/behavioralAggregate.js';

/*
 * Presentación de los indicadores del seguimiento individual (RF-142,
 * RF-128). Solo formatean: no calculan ni infieren indicadores.
 *
 * - El nivel de progreso es una categoría: nunca se convierte en
 *   porcentaje. Un valor desconocido no se muestra crudo.
 * - La adherencia llega como fracción entre 0 y 1 y se muestra en %
 *   (0.41 → «41 %») solo aquí, en la presentación.
 * - `null` significa «no disponible», nunca 0.
 */
const LEVEL_LABEL = Object.freeze({
  [PROGRESS_LEVEL.INITIAL]: 'Inicial',
  [PROGRESS_LEVEL.IN_PROGRESS]: 'En avance',
  [PROGRESS_LEVEL.ADVANCED]: 'Avanzado',
  [PROGRESS_LEVEL.COMPLETED]: 'Completado',
});

export const PROGRESS_LEVEL_OPTIONS = Object.freeze(
  Object.entries(LEVEL_LABEL).map(([value, label]) => Object.freeze({ value, label })),
);

export const NOT_AVAILABLE_LABEL = 'No disponible';

export function progressLevelLabel(level) {
  if (level === null || level === undefined) return NOT_AVAILABLE_LABEL;

  return LEVEL_LABEL[level] ?? 'Nivel no reconocido';
}

const PERCENT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

// Porcentaje entero de una fracción entre 0 y 1, o null.
export function adherencePercent(fraction) {
  return typeof fraction === 'number' && Number.isFinite(fraction) ? Math.round(fraction * 100) : null;
}

export function adherenceLabel(fraction) {
  const percent = adherencePercent(fraction);

  return percent === null ? NOT_AVAILABLE_LABEL : `${PERCENT.format(percent)} %`;
}
