/*
 * Escenarios del modo de demostración (VITE_M08_DEMO_SCENARIO). Solo
 * los usa la fuente de demostración, que no llega al build de
 * producción. Activación del modo: ver cohortDemoMode.js.
 *
 * - lista (predeterminado); vacio: no hay cohortes;
 * - carga: las consultas no terminan; error: las consultas fallan;
 * - error-guardado: guardar o cambiar de estado falla;
 * - sin-cronogramas: ninguno activo;
 * - activacion-bloqueada: los cronogramas de las cohortes iniciales
 *   ya no están activos, y activarlas se rechaza;
 * - carga-participantes / error-participantes: solo la consulta de
 *   participantes de una cohorte no termina o falla;
 * - error-catalogo: solo la consulta de participantes disponibles falla;
 * - conflictos-asignacion: PART-0009 ya está en la Cohorte Piloto B
 *   (ACTIVA) y el catálogo está desactualizado (todos aparecen
 *   disponibles), así los conflictos se ven al confirmar.
 * - retiro-desactualizado: al consultar la Cohorte Piloto B, otra
 *   operación retira a PART-0002 sin que la lista lo refleje; al
 *   retirarlo se ve el conflicto por datos desactualizados.
 * La asignación y el retiro también fallan con error-guardado.
 */
export const DEMO_SCENARIO = Object.freeze({
  LIST: 'lista',
  EMPTY: 'vacio',
  LOADING: 'carga',
  ERROR: 'error',
  NO_ACTIVE_SCHEDULES: 'sin-cronogramas',
  SAVE_ERROR: 'error-guardado',
  ACTIVATION_BLOCKED: 'activacion-bloqueada',
  PARTICIPANTS_LOADING: 'carga-participantes',
  PARTICIPANTS_ERROR: 'error-participantes',
  CATALOG_ERROR: 'error-catalogo',
  ASSIGNMENT_CONFLICTS: 'conflictos-asignacion',
  STALE_REMOVAL: 'retiro-desactualizado',
});

// Escenario de la demostración; un valor desconocido muestra la lista.
export function getDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_DEMO_SCENARIO;

  return Object.values(DEMO_SCENARIO).includes(scenario)
    ? scenario
    : DEMO_SCENARIO.LIST;
}
