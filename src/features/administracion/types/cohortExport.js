// Exportación CSV de indicadores agregados de la cohorte activa (RF-144).

// Situación de la exportación para la interfaz.
export const EXPORT_STATUS = Object.freeze({
  IDLE: 'IDLE',
  EXPORTING: 'EXPORTING',
  // CSV generado y descarga entregada al navegador.
  STARTED: 'STARTED',
  // FA1 (403).
  FORBIDDEN: 'FORBIDDEN',
  // FA2 (422): cohorte inactiva o inexistente.
  COHORT_NOT_ACTIVE: 'COHORT_NOT_ACTIVE',
  // FA3 (422): sin indicadores calculados.
  NO_INDICATORS: 'NO_INDICATORS',
  // FA5 (500).
  GENERATION_FAILED: 'GENERATION_FAILED',
  // La bitácora (simulada en demostración) no registró: sin descarga.
  AUDIT_UNAVAILABLE: 'AUDIT_UNAVAILABLE',
  // El navegador no pudo iniciar la descarga.
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
});

// Códigos con los que la fuente rechaza la exportación.
export const EXPORT_ERROR = Object.freeze({
  FORBIDDEN: 'EXPORT_FORBIDDEN',
  COHORT_NOT_ACTIVE: 'EXPORT_COHORT_NOT_ACTIVE',
  NO_INDICATORS: 'EXPORT_NO_INDICATORS',
  GENERATION_FAILED: 'EXPORT_GENERATION_FAILED',
  AUDIT_UNAVAILABLE: 'EXPORT_AUDIT_UNAVAILABLE',
});

// Origen de la exportación.
export const EXPORT_SOURCE_MODE = Object.freeze({
  DEMO: 'DEMO',
  PENDING_INTEGRATION: 'PENDING_INTEGRATION',
});

// Estado visible de cada componente del CSV.
export const EXPORT_VIEW_STATE = Object.freeze({
  AVAILABLE: 'DISPONIBLE',
  STALE: 'DESACTUALIZADA',
  NOT_AVAILABLE: 'NO_DISPONIBLE',
});

// Marca de un dato que no está disponible (RF-144: «no disponibles»).
// Nunca se sustituye por cero.
export const EXPORT_NOT_AVAILABLE = 'No disponible';

/*
 * COLUMNAS DEL CSV: lista blanca con nombre y orden fijos. Solo
 * indicadores agregados visibles en RF-132 y RF-134 (con los nombres de
 * campo de RF-78 y RF-134), el estado visible de cada vista y su fecha.
 * Nada de RF-133 ni datos individuales.
 */
export const EXPORT_COLUMNS = Object.freeze([
  'nombre_cohorte',
  'estado_vista_conductual',
  'fecha_actualizacion_conductual',
  'total_usuarios_activos',
  'usuarios_nivel_inicial',
  'usuarios_nivel_en_avance',
  'usuarios_nivel_avanzado',
  'usuarios_nivel_completado',
  'tasa_adherencia_promedio',
  'alertas_inactividad_pendientes',
  'alertas_craving_pendientes',
  'estado_vista_notificaciones',
  'fecha_actualizacion_notificaciones',
  'tasa_apertura_promedio',
  'tasa_conversion_promedio',
  'total_notificaciones_enviadas',
  'total_notificaciones_entregadas',
  'total_notificaciones_descartadas',
]);
