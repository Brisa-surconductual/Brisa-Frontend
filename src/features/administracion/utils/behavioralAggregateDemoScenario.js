/*
 * Escenarios de la vista agregada de demostración
 * (VITE_M08_AGGREGATE_SCENARIO). Independientes de los demás escenarios
 * del M08. Solo los usa la fuente de demostración, que no llega al build
 * de producción. Activación del modo: ver cohortDemoMode.js.
 *
 * - disponible (predeterminado): cada cohorte ficticia devuelve su
 *   propia vista con datos;
 * - sin-consolidar: M05 aún no consolidó la cohorte (estado funcional);
 * - desactualizada: M05 no está disponible y se entrega la última vista;
 * - suprimido: la fuente declara el agregado suprimido. Es un valor del
 *   contrato; el frontend no aplica ningún umbral propio;
 * - no-disponible: M05 no está disponible y no hay vista anterior;
 * - carga: la consulta no termina;
 * - error: la consulta falla.
 */
export const AGGREGATE_DEMO_SCENARIO = Object.freeze({
  AVAILABLE: 'disponible',
  NOT_CONSOLIDATED: 'sin-consolidar',
  STALE: 'desactualizada',
  SUPPRESSED: 'suprimido',
  NOT_AVAILABLE: 'no-disponible',
  LOADING: 'carga',
  ERROR: 'error',
});

// Escenario de la demostración; un valor desconocido muestra datos.
export function getAggregateDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_AGGREGATE_SCENARIO;

  return Object.values(AGGREGATE_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : AGGREGATE_DEMO_SCENARIO.AVAILABLE;
}
