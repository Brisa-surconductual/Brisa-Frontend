// Acciones auditables del módulo administrativo (RF-123,
// accion_realizada). Solo las cuatro que define el requerimiento: un
// valor distinto se presenta como no clasificado, sin inventar su
// significado. El catálogo definitivo está PENDIENTE de contrato.
export const AUDIT_ACTION = Object.freeze({
  MODULE_ACCESS: 'ACCESO_MODULO',
  PARTICIPANT_QUERY: 'CONSULTA_PARTICIPANTE',
  DATA_EXPORT: 'EXPORTACION_DATOS',
  THRESHOLD_CONFIGURATION: 'CONFIGURACION_UMBRALES',
});
