import { AUDIT_SOURCE_MODE } from '../types/auditSource.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Fuente de registros de auditoría (RF-123) que consume el hook.
 * Separada de la gestión de cohortes y participantes.
 *
 * Hoy solo existe la fuente de demostración de desarrollo. Sin ella,
 * el modo es PENDING_INTEGRATION: no se consulta nada. Al autorizarse la
 * integración, `listAuditRecords` delegará en un adaptador de `api/` con
 * la misma firma: devolverá la lista en el orden del servidor, o
 * rechazará con `error.code` (p. ej. AUDIT_QUERY_ERROR.ACCESS_DENIED).
 * Un error nunca se responderá con registros ficticios.
 */
const NOT_INTEGRATED = 'La consulta de auditoría aún no está integrada.';

/*
 * Único punto que carga la demostración de auditoría. El import
 * dinámico está dentro de la condición del M08: en producción la rama
 * se elimina y ningún registro ni escenario ficticio llega al build.
 */
async function loadAuditDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./auditDemoSource.js');
}

export function getAuditSourceMode() {
  return isCohortDemoEnabled()
    ? AUDIT_SOURCE_MODE.DEMO
    : AUDIT_SOURCE_MODE.PENDING_INTEGRATION;
}

export async function listAuditRecords() {
  return (await loadAuditDemoSource()).listAuditRecords();
}
