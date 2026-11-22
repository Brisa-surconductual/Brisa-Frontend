const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
});

// RF-24/RF-22: fecha legible de habilitación, o null si el backend no pudo
// estimarla (o no es una fecha válida).
export function textoHabilitacion(habilitaAprox) {
  if (!habilitaAprox) return null;
  const fecha = new Date(habilitaAprox);
  return Number.isNaN(fecha.getTime()) ? null : FORMATO_FECHA.format(fecha);
}
