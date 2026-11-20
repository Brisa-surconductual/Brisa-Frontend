/*
 * Fecha y hora de un registro de auditoría (RF-123, marca_temporal).
 *
 * Solo se interpretan marcas ISO 8601 con zona horaria explícita (Z o
 * ±hh:mm) y se muestran en la hora de Colombia (America/Bogota). Una
 * marca sin zona, o inválida, no se interpreta: devuelve null y la
 * interfaz la indica como no disponible. PENDIENTE de contrato: el
 * formato y la zona en que el backend entregará la marca temporal.
 */
export const AUDIT_TIME_ZONE = 'America/Bogota';

const ISO_WITH_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

const FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: AUDIT_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Instante (ms) de una marca con zona explícita; null si no es interpretable.
export function parseAuditTimestamp(value) {
  if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value)) return null;

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

export function formatAuditTimestamp(value) {
  const timestamp = parseAuditTimestamp(value);

  return timestamp === null ? null : FORMATTER.format(timestamp);
}
