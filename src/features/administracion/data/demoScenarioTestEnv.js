/*
 * Solo para pruebas (no lo importa ningún módulo de la aplicación ni
 * importa nada: recibe `vi` de la prueba que lo usa).
 * Restablece los escenarios de demostración del M08 a su valor
 * predeterminado, para que las pruebas no dependan de las variables que
 * cada persona deje en su .env.local durante las pruebas manuales. Cada
 * prueba fija después el escenario que necesita; vi.unstubAllEnvs()
 * restaura los valores originales.
 */
export const DEMO_SCENARIO_VARIABLES = Object.freeze([
  'VITE_M08_DEMO_SCENARIO',
  'VITE_M08_AUDIT_SCENARIO',
  'VITE_M08_TRACKING_SCENARIO',
  'VITE_M08_PROFILE_SCENARIO',
  'VITE_M08_ALERT_HISTORY_SCENARIO',
  'VITE_M08_NARRATIVE_SCENARIO',
  'VITE_M08_NOTIFICATIONS_SCENARIO',
  'VITE_M08_TEMPORAL_SCENARIO',
  'VITE_M08_AGGREGATE_SCENARIO',
  'VITE_M08_NARRATIVE_AGGREGATE_SCENARIO',
  'VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO',
]);

export function resetDemoScenarios(vi) {
  for (const name of DEMO_SCENARIO_VARIABLES) vi.stubEnv(name, '');
}
