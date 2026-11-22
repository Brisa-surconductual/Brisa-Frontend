/*
 * Escenarios de la evolución temporal de demostración
 * (VITE_M08_EVOLUTION_SCENARIO). Independientes de los demás escenarios
 * del M08. Solo los usa la fuente de demostración, que no llega al build
 * de producción. Activación del modo: ver cohortDemoMode.js.
 *
 * - disponible (predeterminado): series válidas, distintas por cohorte
 *   (Piloto B: 6 unidades; Piloto C: 4; Piloto A: solo 1);
 * - unidad-sin-datos: una unidad intermedia sin datos consolidados;
 * - varias-sin-datos: varias unidades sin datos consolidados;
 * - una-unidad: solo una unidad transcurrida;
 * - sin-unidades: ninguna unidad transcurrida;
 * - ceros: valores en cero real, distintos de los null;
 * - m05-no-disponible: M05 no responde (503);
 * - error-construccion: falla la construcción de la serie (500);
 * - sin-informacion: ninguna unidad tiene datos consolidados;
 * - series-inconsistentes: series de longitudes distintas;
 * - filtros-sin-resultados: con filtros, ninguna unidad tiene datos;
 * - sin-cohorte: no existe la cohorte activa (404);
 * - sin-permiso: el usuario no tiene permisos (403);
 * - carga: la consulta no termina.
 */
export const EVOLUTION_DEMO_SCENARIO = Object.freeze({
  AVAILABLE: 'disponible',
  ONE_GAP: 'unidad-sin-datos',
  SEVERAL_GAPS: 'varias-sin-datos',
  ONE_UNIT: 'una-unidad',
  NO_UNITS: 'sin-unidades',
  ZEROS: 'ceros',
  SOURCE_UNAVAILABLE: 'm05-no-disponible',
  BUILD_ERROR: 'error-construccion',
  NO_INFORMATION: 'sin-informacion',
  INCONSISTENT: 'series-inconsistentes',
  NO_FILTER_RESULTS: 'filtros-sin-resultados',
  NO_COHORT: 'sin-cohorte',
  FORBIDDEN: 'sin-permiso',
  LOADING: 'carga',
});

export function getEvolutionDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_EVOLUTION_SCENARIO;

  return Object.values(EVOLUTION_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : EVOLUTION_DEMO_SCENARIO.AVAILABLE;
}
