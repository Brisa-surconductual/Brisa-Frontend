/*
 * Escenarios del seguimiento de demostración (VITE_M08_TRACKING_SCENARIO).
 * Independientes de los de cohortes, participantes y auditoría. Solo los
 * usa la fuente de demostración de seguimiento, que no llega al build de
 * producción. Activación del modo: ver cohortDemoMode.js.
 *
 * - lista (predeterminado): indicadores ficticios autorizados;
 * - carga: la consulta no termina;
 * - error: la consulta falla;
 * - denegado: la fuente responde DENEGADO (e incluye registros, para
 *   comprobar que la interfaz no los muestra). Resultado simulado, no
 *   una comprobación real de permisos;
 * - registro-ajeno: un registro declara otra cohorte;
 * - respuesta-ajena: la respuesta entera declara otra cohorte.
 */
export const TRACKING_DEMO_SCENARIO = Object.freeze({
  LIST: 'lista',
  LOADING: 'carga',
  ERROR: 'error',
  DENIED: 'denegado',
  FOREIGN_RECORD: 'registro-ajeno',
  FOREIGN_RESPONSE: 'respuesta-ajena',
});

// Escenario de la demostración; un valor desconocido muestra la lista.
export function getTrackingDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_TRACKING_SCENARIO;

  return Object.values(TRACKING_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : TRACKING_DEMO_SCENARIO.LIST;
}
