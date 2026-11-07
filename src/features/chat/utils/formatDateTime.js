// Fecha y hora legibles en hora de Colombia, a partir del ISO del backend.
// Devuelve null si el valor no es una fecha válida.
export function formatDateTime(isoDate) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
