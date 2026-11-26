/*
 * Escenarios de la bitácora de demostración (VITE_M08_AUDIT_SCENARIO).
 * Independientes de los de cohortes y participantes. Solo los usa la
 * fuente de demostración de auditoría, que no llega al build de
 * producción. Activación del modo: ver cohortDemoMode.js.
 *
 * - lista (predeterminado): registros ficticios;
 * - vacia: no hay registros;
 * - carga: la consulta no termina;
 * - error: la consulta falla;
 * - denegada: la fuente rechaza la consulta como acceso denegado. Es un
 *   resultado simulado, no una comprobación real de permisos.
 */
export const AUDIT_DEMO_SCENARIO = Object.freeze({
  LIST: 'lista',
  EMPTY: 'vacia',
  LOADING: 'carga',
  ERROR: 'error',
  DENIED: 'denegada',
});

// Escenario de la demostración; un valor desconocido muestra la lista.
export function getAuditDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_AUDIT_SCENARIO;

  return Object.values(AUDIT_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : AUDIT_DEMO_SCENARIO.LIST;
}
