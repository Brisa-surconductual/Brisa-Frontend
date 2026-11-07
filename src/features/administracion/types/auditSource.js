// Origen de los registros de auditoría que ve la interfaz.
// DEMO: registros ficticios de desarrollo. PENDING_INTEGRATION: la
// consulta aún no está conectada al servidor.
export const AUDIT_SOURCE_MODE = Object.freeze({
  DEMO: 'DEMO',
  PENDING_INTEGRATION: 'PENDING_INTEGRATION',
});

/*
 * Código estructurado con el que la fuente rechaza la consulta
 * (`error.code`). La interfaz decide con él, nunca con el texto.
 * PROVISIONAL: equivale a un 403; el código real lo fijará el backend.
 */
export const AUDIT_QUERY_ERROR = Object.freeze({
  ACCESS_DENIED: 'ACCESO_DENEGADO',
});
