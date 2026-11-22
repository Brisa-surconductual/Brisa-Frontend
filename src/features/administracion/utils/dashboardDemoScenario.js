/*
 * Escenario propio del panel principal de demostración
 * (VITE_M08_DASHBOARD_SCENARIO). Solo lo usa la fuente de demostración
 * del panel, que no llega al build de producción.
 *
 * - normal (predeterminado): cada vista se comporta según su propio
 *   escenario (VITE_M08_AGGREGATE_SCENARIO,
 *   VITE_M08_NARRATIVE_AGGREGATE_SCENARIO,
 *   VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO);
 * - caida-tras-carga: la primera consulta de cada vista responde con
 *   normalidad y las siguientes fallan, para comprobar que el panel
 *   conserva la última versión válida al pulsar «Actualizar panel».
 *
 * El resto de escenarios (fallas parciales, tiempo límite, datos
 * desactualizados, sin cohorte activa, alertas en cero) se reproducen
 * con los escenarios de cada vista y de cohortes; ver el informe de
 * RF-140.
 */
export const DASHBOARD_DEMO_SCENARIO = Object.freeze({
  NORMAL: 'normal',
  OUTAGE_AFTER_LOAD: 'caida-tras-carga',
});

export function getDashboardDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_DASHBOARD_SCENARIO;

  return Object.values(DASHBOARD_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : DASHBOARD_DEMO_SCENARIO.NORMAL;
}
