/**
 * Porcentaje de avance, acotado a 0-100.
 *
 * Devuelve 0 ante cualquier entrada que no permita calcularlo (max <= 0,
 * NaN, Infinity, valores no numéricos), para que la barra nunca se pinte con
 * un ancho inválido.
 */
export function toProgressPercent(value, max) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}
