/*
 * Escenarios de la vista narrativa de demostración
 * (VITE_M08_NARRATIVE_AGGREGATE_SCENARIO). Independientes de los demás escenarios
 * del M08, incluido el de la vista conductual (RF-132): simular una
 * falla de M06 no afecta a ninguna otra vista. Solo los usa la fuente de
 * demostración, que no llega al build de producción. Activación del
 * modo: ver cohortDemoMode.js.
 *
 * - disponible (predeterminado): cada cohorte ficticia devuelve su
 *   propia vista; la Cohorte Piloto A no tiene métricas narrativas;
 * - sin-consolidar: M06 aún no ejecutó su primer ciclo de agregación;
 * - sin-metricas: ningún usuario de la cohorte tiene perfil narrativo
 *   activo (estado funcional, sin error);
 * - usuarios-excluidos: hay datos, y M06 avisa que algunos usuarios sin
 *   perfil narrativo no se incluyen en la distribución;
 * - desactualizada: M06 no está disponible y se entrega la última vista;
 * - no-disponible: M06 no está disponible y no hay vista anterior;
 * - carga: la consulta no termina;
 * - error: la consulta falla.
 */
export const NARRATIVE_AGGREGATE_DEMO_SCENARIO = Object.freeze({
  AVAILABLE: 'disponible',
  NOT_CONSOLIDATED: 'sin-consolidar',
  NO_METRICS: 'sin-metricas',
  EXCLUDED_USERS: 'usuarios-excluidos',
  STALE: 'desactualizada',
  NOT_AVAILABLE: 'no-disponible',
  LOADING: 'carga',
  ERROR: 'error',
});

// Escenario de la demostración; un valor desconocido muestra datos.
export function getNarrativeAggregateDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_NARRATIVE_AGGREGATE_SCENARIO;

  return Object.values(NARRATIVE_AGGREGATE_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : NARRATIVE_AGGREGATE_DEMO_SCENARIO.AVAILABLE;
}
