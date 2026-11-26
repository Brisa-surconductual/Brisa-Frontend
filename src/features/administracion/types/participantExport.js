// Exportación CSV individual del historial cuantitativo (RF-145).

/*
 * Columnas del CSV, con nombre y orden fijos del contrato del backend.
 * Solo indicadores cuantitativos por unidad temporal: ni el seudónimo ni
 * otro identificador del participante, ni texto de diario o chat.
 */
export const PARTICIPANT_EXPORT_COLUMNS = Object.freeze([
  'orden_unidad_temporal',
  'nombre_unidad',
  'fecha_inicio_unidad',
  'fecha_fin_unidad',
  'nivel_progreso',
  'tasa_adherencia',
  'craving_promedio',
  'alertas_generadas',
  'alertas_atendidas',
]);

// Origen de la exportación. En la demostración no hay exportación real.
export const PARTICIPANT_EXPORT_SOURCE_MODE = Object.freeze({
  API: 'API',
  DEMO_UNAVAILABLE: 'DEMO_UNAVAILABLE',
});

// Códigos con los que la API rechaza la exportación.
export const PARTICIPANT_EXPORT_ERROR = Object.freeze({
  INVALID_CODE: 'PARTICIPANT_EXPORT_INVALID_CODE',
  SESSION_REQUIRED: 'PARTICIPANT_EXPORT_SESSION_REQUIRED',
  FORBIDDEN: 'PARTICIPANT_EXPORT_FORBIDDEN',
  NOT_FOUND: 'PARTICIPANT_EXPORT_NOT_FOUND',
  INCONSISTENT: 'PARTICIPANT_EXPORT_INCONSISTENT',
  NO_INDICATORS: 'PARTICIPANT_EXPORT_NO_INDICATORS',
  UNAVAILABLE: 'PARTICIPANT_EXPORT_UNAVAILABLE',
  ABORTED: 'PARTICIPANT_EXPORT_ABORTED',
  CONNECTION: 'PARTICIPANT_EXPORT_CONNECTION',
  INVALID_RESPONSE: 'PARTICIPANT_EXPORT_INVALID_RESPONSE',
});

// Situación de la exportación para la interfaz.
export const PARTICIPANT_EXPORT_STATUS = Object.freeze({
  IDLE: 'IDLE',
  EXPORTING: 'EXPORTING',
  // Archivo válido entregado al navegador. No confirma que se haya guardado.
  STARTED: 'STARTED',
  INVALID_CODE: 'INVALID_CODE',
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INCONSISTENT: 'INCONSISTENT',
  NO_INDICATORS: 'NO_INDICATORS',
  UNAVAILABLE: 'UNAVAILABLE',
  ABORTED: 'ABORTED',
  CONNECTION: 'CONNECTION',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  // El navegador no pudo iniciar la descarga.
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
});

// Motivo por el que la acción no se puede ejecutar.
export const PARTICIPANT_EXPORT_BLOCK = Object.freeze({
  DEMO: 'DEMO',
  // La ficha no tiene un seudónimo A7 entregado por una fuente real.
  IDENTITY_PENDING: 'IDENTITY_PENDING',
});
