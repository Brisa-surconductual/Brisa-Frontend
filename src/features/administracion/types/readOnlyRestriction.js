/*
 * Restricción de solo lectura sobre datos de participantes (RF-148).
 *
 * Contrato RF-148 del backend: HTTP 403 con { status, codigo, mensaje }.
 */
export const READ_ONLY_HTTP_STATUS = 403;

export const READ_ONLY_ERROR_CODE = 'ESCRITURA_NO_PERMITIDA';

// Texto de la nota informativa y respaldo si una respuesta omite el mensaje.
export const READ_ONLY_MESSAGE =
  'Esta información es de solo lectura para el rol administrativo.';
