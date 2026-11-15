/*
 * Escenarios de la consulta temporal de demostración (M04,
 * VITE_M08_TEMPORAL_SCENARIO). Independientes de los demás del M08.
 * Solo los usa la fuente de demostración, que no llega al build de
 * producción. No son respuestas reales del backend.
 *
 * - cronograma (predeterminado): resultado según los datos ficticios;
 * - carga, error, denegado, sin-datos, inexistente, otro-participante,
 *   otra-cohorte y no-disponible, como en las demás secciones.
 *
 * RF-149 no incluye a M04 entre los módulos con modo degradado, por eso
 * esta sección no tiene escenarios de datos desactualizados: si M04 no
 * está disponible, la sección muestra su propio error.
 */
export const TEMPORAL_DEMO_SCENARIO = Object.freeze({
  DATA: 'cronograma',
  LOADING: 'carga',
  ERROR: 'error',
  DENIED: 'denegado',
  EMPTY: 'sin-datos',
  NOT_FOUND: 'inexistente',
  OTHER_PARTICIPANT: 'otro-participante',
  OTHER_COHORT: 'otra-cohorte',
  UNAVAILABLE: 'no-disponible',
});

// Escenario de la demostración; un valor desconocido usa los datos.
export function getTemporalDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_TEMPORAL_SCENARIO;

  return Object.values(TEMPORAL_DEMO_SCENARIO).includes(scenario) ? scenario : TEMPORAL_DEMO_SCENARIO.DATA;
}
