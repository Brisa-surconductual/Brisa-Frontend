import { AUDIT_QUERY_ERROR } from '../types/auditSource.js';
import { AUDIT_DEMO_SCENARIO, getAuditDemoScenario } from '../utils/auditDemoScenario.js';
import { DEMO_AUDIT_RECORDS } from './auditDemoData.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE AUDITORÍA (solo desarrollo). Solo la carga
 * auditSource.js mediante import() dinámico cuando el modo demo está
 * activo; en producción este módulo no llega al build.
 *
 * Es de solo lectura y está separada de cohortes y participantes: no
 * registra eventos ni recibe operaciones de otras pantallas. Aplica el
 * escenario de VITE_M08_AUDIT_SCENARIO y una breve espera.
 */
export const AUDIT_DEMO_DELAY_MS = 400;

const pause = () => new Promise((resolve) => setTimeout(resolve, AUDIT_DEMO_DELAY_MS));

// Rechazo con código estructurado, como lo hará el adaptador real.
function deniedError() {
  const error = new Error('Acceso denegado simulado por la fuente de demostración.');
  error.code = AUDIT_QUERY_ERROR.ACCESS_DENIED;
  return error;
}

export async function listAuditRecords() {
  const scenario = getAuditDemoScenario();

  if (scenario === AUDIT_DEMO_SCENARIO.LOADING) return new Promise(() => {});

  await pause();

  if (scenario === AUDIT_DEMO_SCENARIO.ERROR) {
    throw new Error('Error simulado al consultar la bitácora de demostración.');
  }

  if (scenario === AUDIT_DEMO_SCENARIO.DENIED) throw deniedError();

  return scenario === AUDIT_DEMO_SCENARIO.EMPTY ? [] : DEMO_AUDIT_RECORDS;
}
