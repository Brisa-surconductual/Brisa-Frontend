import { PROGRESS_LEVEL } from '../../types/behavioralAggregate.js';

// Formatos de los gráficos de evolución (RF-141): valores originales.

// Adherencia y craving: sin redondear, con los decimales que traen.
export const VALUE_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 20,
});

export const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

export const NO_DATA = 'Sin datos';

// Identificador seguro para url(#...) a partir de useId().
export const svgId = (value) => value.replace(/[^a-zA-Z0-9_-]/g, '');

// Centro horizontal de la unidad `index` de `count`, en porcentaje.
export const unitCenter = (index, count) => `${((index + 0.5) / count) * 100}%`;

// Ancho mínimo del área gráfica: legible en móvil sin comprimir unidades.
export const chartMinWidth = (count, perUnit) => `${count * perUnit}px`;

// Niveles de RF-70, en orden; tonos crecientes y letra propia, para no
// depender solo del color.
export const LEVEL_STYLE = Object.freeze({
  [PROGRESS_LEVEL.INITIAL]: Object.freeze({
    label: 'Inicial',
    short: 'I',
    color: 'bg-[var(--brand-200)]',
  }),
  [PROGRESS_LEVEL.IN_PROGRESS]: Object.freeze({
    label: 'En avance',
    short: 'E',
    color: 'bg-[var(--brand-400)]',
  }),
  [PROGRESS_LEVEL.ADVANCED]: Object.freeze({
    label: 'Avanzado',
    short: 'A',
    color: 'bg-[var(--brand-600)]',
  }),
  [PROGRESS_LEVEL.COMPLETED]: Object.freeze({
    label: 'Completado',
    short: 'C',
    color: 'bg-[var(--brand-800)]',
  }),
});
