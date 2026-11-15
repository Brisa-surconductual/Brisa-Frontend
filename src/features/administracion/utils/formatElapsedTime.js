/*
 * Presentación del tiempo efectivo transcurrido (RF-22), que el backend
 * entrega en segundos ya descontadas las pausas. Solo cambia la unidad
 * para leerlo (días y horas completos, sin redondear hacia arriba); no
 * calcula fechas, duraciones ni progreso. Un valor que no sea un entero
 * ≥ 0 devuelve null («No disponible»).
 */
const DAY = 86400;
const HOUR = 3600;

const plural = (value, one, many) => `${value} ${value === 1 ? one : many}`;

export function formatElapsedTime(seconds) {
  if (!Number.isInteger(seconds) || seconds < 0) return null;

  const days = Math.floor(seconds / DAY);
  const hours = Math.floor((seconds % DAY) / HOUR);

  if (days === 0 && hours === 0) return 'Menos de 1 hora';
  if (days === 0) return plural(hours, 'hora', 'horas');
  if (hours === 0) return plural(days, 'día', 'días');

  return `${plural(days, 'día', 'días')} y ${plural(hours, 'hora', 'horas')}`;
}
