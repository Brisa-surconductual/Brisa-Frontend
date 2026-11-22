import { EXPORT_SOURCE_MODE } from '../types/cohortExport.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Puerto de la exportación CSV de indicadores de la cohorte activa
 * (RF-144). Devuelve { fileName, content, sizeBytes,
 * notificationsAvailable, behavioralStale } o rechaza con `error.code`
 * (types/cohortExport.js: EXPORT_ERROR).
 *
 * CONTRATO DE INTEGRACIÓN FUTURA (no implementado aquí):
 *   GET /admin/cohortes/:id/exportacion.csv
 *   - archivo indicadores_cohorte_activa_YYYYMMDD.csv, text/csv; UTF-8;
 *   - el backend genera el CSV con un DTO de lista blanca: el frontend no
 *     recibe datos crudos;
 *   - la auditoría (RF-123: usuario, sesión, acción, cohorte, fecha y
 *     hora, IP, estado, nombre y tamaño del archivo) se registra de forma
 *     síncrona ANTES de enviar el archivo; si falla, no hay descarga. Se
 *     registran también los intentos fallidos y denegados;
 *   - FA4: si la petición incluye include_pii=true (u otra manipulación),
 *     el backend la ignora, responde 200 con el CSV sanitizado y registra
 *     una alerta de seguridad en sus logs;
 *   - errores: 403 (FA1), 422 (FA2, FA3), 500 (FA5).
 * El adaptador de `api/` deberá traducir esas respuestas a EXPORT_ERROR.
 *
 * Hoy solo existe la demostración de desarrollo. Sin ella el modo es
 * PENDING_INTEGRATION: no se genera ningún CSV local como reemplazo del
 * endpoint ni se afirma una exportación auditada.
 */
const NOT_INTEGRATED = 'La exportación CSV aún no está integrada.';

/*
 * Único punto que carga la demostración de la exportación. El import
 * dinámico está dentro de la condición del M08: en producción la rama se
 * elimina y ningún dato ficticio llega al build.
 */
async function loadExportDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./cohortExportDemoSource.js');
}

export function getExportSourceMode() {
  return isCohortDemoEnabled()
    ? EXPORT_SOURCE_MODE.DEMO
    : EXPORT_SOURCE_MODE.PENDING_INTEGRATION;
}

export async function exportCohortIndicatorsCsv(cohortId, request = {}) {
  return (await loadExportDemoSource()).exportCohortIndicatorsCsv(
    cohortId,
    request,
  );
}
