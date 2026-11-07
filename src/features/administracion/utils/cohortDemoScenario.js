/*
 * Escenarios del modo de demostración (VITE_M08_DEMO_SCENARIO). Solo
 * los usa la fuente de demostración, que no llega al build de
 * producción. Activación del modo: ver cohortDemoMode.js.
 *
 * - lista (predeterminado); vacio: no hay cohortes;
 * - carga: las consultas no terminan; error: las consultas fallan;
 * - error-guardado: guardar falla; sin-cronogramas: ninguno activo.
 */
export const DEMO_SCENARIO = Object.freeze({
  LIST: 'lista',
  EMPTY: 'vacio',
  LOADING: 'carga',
  ERROR: 'error',
  NO_ACTIVE_SCHEDULES: 'sin-cronogramas',
  SAVE_ERROR: 'error-guardado',
});

// Escenario de la demostración; un valor desconocido muestra la lista.
export function getDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_DEMO_SCENARIO;

  return Object.values(DEMO_SCENARIO).includes(scenario)
    ? scenario
    : DEMO_SCENARIO.LIST;
}
