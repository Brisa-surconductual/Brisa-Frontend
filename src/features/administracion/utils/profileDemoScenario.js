/*
 * Escenarios de la ficha individual de demostración
 * (VITE_M08_PROFILE_SCENARIO). Independientes de los del listado
 * (VITE_M08_TRACKING_SCENARIO) y del resto del M08. Solo los usa la
 * fuente de demostración, que no llega al build de producción.
 *
 * - perfil (predeterminado): resultado según los datos ficticios;
 * - carga: la consulta no termina;
 * - error: la consulta falla (equivale al 500 de RF-128);
 * - denegado: la fuente responde DENEGADO e incluye datos, para
 *   comprobar que no se muestran (simulado, no es seguridad real);
 * - sin-perfil: no hay perfil (204 de RF-128);
 * - inexistente: la referencia no existe (404 de RF-128);
 * - inconsistente: la respuesta es de otro participante (409 de RF-128);
 * - otra-cohorte: la respuesta declara otra cohorte;
 * - fuera-de-cohorte: el participante ya no pertenece a la cohorte;
 * - no-disponible: M05 no disponible (503 de RF-128).
 */
export const PROFILE_DEMO_SCENARIO = Object.freeze({
  PROFILE: 'perfil',
  LOADING: 'carga',
  ERROR: 'error',
  DENIED: 'denegado',
  NO_PROFILE: 'sin-perfil',
  NOT_FOUND: 'inexistente',
  INCONSISTENT: 'inconsistente',
  OTHER_COHORT: 'otra-cohorte',
  OUTSIDE_COHORT: 'fuera-de-cohorte',
  UNAVAILABLE: 'no-disponible',
});

// Escenario de la demostración; un valor desconocido usa los datos.
export function getProfileDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_PROFILE_SCENARIO;

  return Object.values(PROFILE_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : PROFILE_DEMO_SCENARIO.PROFILE;
}
