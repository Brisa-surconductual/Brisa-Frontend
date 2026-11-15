/*
 * Registro de auditoría tal como lo presenta la interfaz (RF-123).
 *
 * LISTA EXPLÍCITA de campos permitidos: id (solo como clave interna,
 * nunca se muestra), action, resource, timestamp y status. Cualquier
 * otro campo de la fuente se descarta aquí: dirección IP, usuario,
 * sesión, identificador del recurso, correos, nombres, documentos,
 * datos clínicos o de consumo, cuerpos de solicitud o user-agent. Su
 * exposición futura requiere contrato y autorización específicos.
 *
 * Correspondencia PROVISIONAL con RF-123: id ← id_auditoria,
 * action ← accion_realizada, resource ← recurso_afectado,
 * timestamp ← marca_temporal, status ← estado_accion.
 */
const asText = (value) => (typeof value === 'string' ? value : '');

export function toAuditEntry(record) {
  return Object.freeze({
    id: asText(record?.id),
    action: asText(record?.action),
    resource: asText(record?.resource),
    timestamp: asText(record?.timestamp),
    status: asText(record?.status),
  });
}

// Conserva el orden recibido de la fuente: no ordena ni filtra.
export function toAuditEntries(records) {
  return Object.freeze((Array.isArray(records) ? records : []).map(toAuditEntry));
}
