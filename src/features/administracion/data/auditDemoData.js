import { AUDIT_ACTION } from '../types/auditAction.js';
import { AUDIT_STATUS } from '../types/auditStatus.js';

/*
 * REGISTROS FICTICIOS DE AUDITORÍA (solo desarrollo, VITE_M08_DEMO).
 * No representan acciones reales de ningún usuario ni las operaciones
 * de cohortes o participantes realizadas en este entorno: esas
 * operaciones NO se registran aquí. No son el contrato del backend.
 *
 * Forma interna mínima: { id, action, resource, timestamp, status }.
 * Algunos registros traen campos adicionales a propósito (IP, usuario,
 * sesión, recurso, correo, nombre, documento, consumo, cuerpo de la
 * solicitud, user-agent) para comprobar que la interfaz los descarta.
 * Las IP pertenecen a los rangos reservados para documentación
 * (RFC 5737) y los correos al dominio reservado example.com.
 *
 * Se entregan en este orden, que la interfaz respeta; incluyen una
 * acción no clasificada y una marca temporal sin zona horaria.
 */
export const DEMO_AUDIT_RECORDS = Object.freeze([
  Object.freeze({
    id: 'demo-auditoria-1',
    action: AUDIT_ACTION.MODULE_ACCESS,
    resource: 'Módulo administrativo',
    timestamp: '2026-03-09T14:32:05Z',
    status: AUDIT_STATUS.SUCCESS,
    ipAddress: '192.0.2.10',
    userId: 'demo-usuario-interno-1',
    sessionId: 'demo-sesion-interna-1',
  }),
  Object.freeze({
    id: 'demo-auditoria-2',
    action: AUDIT_ACTION.PARTICIPANT_QUERY,
    resource: 'Perfil de seguimiento de un participante',
    timestamp: '2026-03-09T09:15:40-05:00',
    status: AUDIT_STATUS.SUCCESS,
    resourceId: 'demo-recurso-interno-2',
    participantName: 'Nombre Ficticio',
    participantEmail: 'participante.ficticio@example.com',
    document: '0000000000',
  }),
  Object.freeze({
    id: 'demo-auditoria-3',
    action: AUDIT_ACTION.DATA_EXPORT,
    resource: 'Exportación de indicadores agregados',
    timestamp: '2026-03-08T21:04:12Z',
    status: AUDIT_STATUS.FAILED,
    requestBody: '{"formato":"csv"}',
    userAgent: 'Navegador ficticio/1.0',
  }),
  Object.freeze({
    id: 'demo-auditoria-4',
    action: AUDIT_ACTION.THRESHOLD_CONFIGURATION,
    resource: 'Umbrales de seguimiento',
    timestamp: '2026-03-08T16:47:30Z',
    status: AUDIT_STATUS.DENIED,
    ipAddress: '198.51.100.24',
    consumptionData: 'dato de consumo ficticio',
    clinicalProfile: 'perfil clínico ficticio',
  }),
  Object.freeze({
    id: 'demo-auditoria-5',
    action: AUDIT_ACTION.PARTICIPANT_QUERY,
    resource: 'Historial de alertas de un participante',
    timestamp: '2026-03-07T12:00:00.000Z',
    status: AUDIT_STATUS.DENIED,
  }),
  Object.freeze({
    id: 'demo-auditoria-6',
    action: 'ACCION_NO_DEFINIDA',
    resource: 'Recurso no clasificado',
    timestamp: '2026-03-06T23:59:59Z',
    status: AUDIT_STATUS.FAILED,
  }),
  Object.freeze({
    id: 'demo-auditoria-7',
    action: AUDIT_ACTION.MODULE_ACCESS,
    resource: 'Módulo administrativo',
    timestamp: '2026-03-06T13:20:00Z',
    status: AUDIT_STATUS.SUCCESS,
    ipAddress: '203.0.113.7',
    userEmail: 'admin.ficticio@example.com',
  }),
  Object.freeze({
    id: 'demo-auditoria-8',
    action: AUDIT_ACTION.DATA_EXPORT,
    resource: 'Exportación de indicadores agregados',
    // Sin zona horaria: la interfaz no la interpreta.
    timestamp: '2026-03-05T08:00:00',
    status: AUDIT_STATUS.SUCCESS,
  }),
]);
