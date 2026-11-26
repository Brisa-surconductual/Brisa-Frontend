/**
 * Semanas que se enseñan en el recorrido. Si el total del programa está
 * definido (constante configurable) se usa; si es null NO se inventa un
 * número: se muestran `preview` semanas de ejemplo y `hasMore` en true.
 * @param {number | null} total
 * @param {number} preview
 * @returns {{ weeks: number[], hasMore: boolean }}
 */
export function getJourneyWeeks(total, preview) {
  const known = Number.isInteger(total) && total > 0;
  const count = known ? total : preview;

  return {
    weeks: Array.from({ length: count }, (_, i) => i + 1),
    hasMore: !known,
  };
}

/**
 * Etapa de la historia (inicio, desarrollo, cierre) para la semana activa.
 * La primera semana es el inicio y la última visible el cierre cuando el
 * total es conocido; si no lo es, el cierre solo aparece al final del
 * recorrido de ejemplo.
 * @param {number} index Posición 0 de la semana activa.
 * @param {number} count Cantidad de semanas visibles.
 * @param {boolean} hasMore
 * @returns {0 | 1 | 2}
 */
export function getStageIndex(index, count, hasMore) {
  if (index <= 0) return 0;
  if (!hasMore && index >= count - 1) return 2;

  return 1;
}
