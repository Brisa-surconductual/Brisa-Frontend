/*
 * Modo de demostración del M08 (solo desarrollo).
 *
 * Los datos ficticios se usan únicamente si se cumplen las dos
 * condiciones: servidor de desarrollo de Vite (`import.meta.env.DEV`)
 * y la variable local VITE_M08_DEMO=true. En el build de producción
 * DEV es false y el modo nunca se activa.
 *
 * Para habilitarlo, en un .env.local (no versionado) o al lanzar
 * `npm run dev`:
 *   VITE_M08_DEMO=true
 *   VITE_M08_DEMO_SCENARIO=lista | vacio | carga | error   (opcional)
 */
export const DEMO_SCENARIO = Object.freeze({
  LIST: 'lista',
  EMPTY: 'vacio',
  LOADING: 'carga',
  ERROR: 'error',
});

export function isCohortDemoEnabled(env = import.meta.env) {
  return Boolean(env.DEV) && env.VITE_M08_DEMO === 'true';
}

// Escenario de la demostración; un valor desconocido muestra la lista.
export function getDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_DEMO_SCENARIO;

  return Object.values(DEMO_SCENARIO).includes(scenario)
    ? scenario
    : DEMO_SCENARIO.LIST;
}
