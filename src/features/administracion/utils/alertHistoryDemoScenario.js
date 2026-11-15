/*
 * Escenarios del historial de alertas de demostración
 * (VITE_M08_ALERT_HISTORY_SCENARIO). Independientes de los de la ficha
 * (VITE_M08_PROFILE_SCENARIO), del listado (VITE_M08_TRACKING_SCENARIO)
 * y del resto del M08. Solo los usa la fuente de demostración, que no
 * llega al build de producción. No son respuestas reales del backend.
 *
 * - historial (predeterminado): resultado según los datos ficticios;
 * - carga: la consulta no termina;
 * - error: la consulta falla (equivale al 500 de RF-129);
 * - denegado: la fuente responde DENEGADO e incluye alertas, para
 *   comprobar que no se muestran (simulado, no es seguridad real);
 * - vacio: sin alertas registradas (204 de RF-129);
 * - inexistente: la referencia no existe (404 de RF-129);
 * - otro-participante: una alerta pertenece a otro participante (409);
 * - otra-cohorte: la respuesta declara otra cohorte;
 * - no-disponible: M05 no disponible (503 de RF-129);
 * - desfase: el historial trae una alerta activa que el resumen de la
 *   ficha no tiene, para comprobar el aviso de diferencia.
 */
export const ALERT_HISTORY_DEMO_SCENARIO = Object.freeze({
  HISTORY: 'historial',
  LOADING: 'carga',
  ERROR: 'error',
  DENIED: 'denegado',
  EMPTY: 'vacio',
  NOT_FOUND: 'inexistente',
  OTHER_PARTICIPANT: 'otro-participante',
  OTHER_COHORT: 'otra-cohorte',
  UNAVAILABLE: 'no-disponible',
  OUT_OF_SYNC: 'desfase',
});

// Escenario de la demostración; un valor desconocido usa los datos.
export function getAlertHistoryDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_ALERT_HISTORY_SCENARIO;

  return Object.values(ALERT_HISTORY_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : ALERT_HISTORY_DEMO_SCENARIO.HISTORY;
}
