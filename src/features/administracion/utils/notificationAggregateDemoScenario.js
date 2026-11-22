/*
 * Escenarios de la vista de efectividad de notificaciones de
 * demostración (VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO). Independientes
 * de los demás escenarios del M08, incluidos el de la interacción
 * individual con notificaciones (VITE_M08_NOTIFICATIONS_SCENARIO, RF-131)
 * y los de las vistas conductual (RF-132) y narrativa (RF-133): simular
 * una falla de M07 no afecta a ninguna otra vista. Solo los usa la fuente
 * de demostración, que no llega al build de producción. Activación del
 * modo: ver cohortDemoMode.js.
 *
 * - disponible (predeterminado): cada cohorte ficticia devuelve su
 *   propia vista; la Cohorte Piloto A aún no tiene envíos;
 * - sin-envios: métricas válidas sin envíos (totales en 0, tasas null);
 * - sin-consolidar: M07 aún no consolidó métricas (estado funcional);
 * - metricas-no-calculables: hay datos, y M07 avisa que algunos
 *   usuarios sin métricas calculables quedaron fuera del promedio;
 * - desactualizada: M07 no está disponible y se entrega la última vista;
 * - no-disponible: M07 no está disponible y no hay vista anterior;
 * - carga: la consulta no termina;
 * - error: la consulta falla.
 */
export const NOTIFICATION_AGGREGATE_DEMO_SCENARIO = Object.freeze({
  AVAILABLE: 'disponible',
  NO_SENDS: 'sin-envios',
  NOT_CONSOLIDATED: 'sin-consolidar',
  NOT_CALCULABLE_USERS: 'metricas-no-calculables',
  STALE: 'desactualizada',
  NOT_AVAILABLE: 'no-disponible',
  LOADING: 'carga',
  ERROR: 'error',
});

// Escenario de la demostración; un valor desconocido muestra datos.
export function getNotificationAggregateDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO;

  return Object.values(NOTIFICATION_AGGREGATE_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : NOTIFICATION_AGGREGATE_DEMO_SCENARIO.AVAILABLE;
}
