/*
 * Restricción de solo lectura sobre datos de participantes (RF-148).
 *
 * El backend debe rechazar las escrituras del rol administrativo sobre
 * recursos de M02, M03, M05, M06 y M07 con HTTP 403 y el código
 * ESCRITURA_NO_PERMITIDA (archivo de tareas, «ErrorApi»). La forma
 * definitiva del error está PENDIENTE de confirmar con el backend.
 *
 * Las escrituras propias del M08 permitidas por RF-148 (cohortes,
 * asociaciones de participantes, configuración y bitácora) no son
 * objeto de esta restricción.
 */
export const READ_ONLY_HTTP_STATUS = 403;

export const READ_ONLY_ERROR_CODE = 'ESCRITURA_NO_PERMITIDA';

// Mensaje uniforme: no se muestra el `message` del servidor.
export const READ_ONLY_MESSAGE =
  'Esta información es de solo lectura para el rol administrativo.';
