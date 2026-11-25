/*
 * Escenarios de los permisos de acceso individual de demostración
 * (VITE_M08_PERMISSION_SCENARIO). Solo los usa la fuente de demostración,
 * que no llega al build de producción.
 *
 * - vigentes (predeterminado): P-1A2B3C4D con dos permisos vigentes, uno
 *   vencido y uno revocado (estos dos no deben aparecer); P-5E6F7A8B sin
 *   permisos; cualquier otro código responde 404;
 * - vacio: P-1A2B3C4D sin permisos;
 * - carga: la lista no termina de cargar;
 * - error: la lista falla;
 * - conflicto: conceder responde 409 PERMISO_YA_VIGENTE, con mensaje del servidor;
 * - autoconcesion: conceder responde 422 AUTOCONCESION_NO_PERMITIDA;
 * - revocacion-error: revocar falla sin respuesta del servidor.
 */
export const PERMISSION_DEMO_SCENARIO = Object.freeze({
  ACTIVE: 'vigentes',
  EMPTY: 'vacio',
  LOADING: 'carga',
  ERROR: 'error',
  CONFLICT: 'conflicto',
  SELF_GRANT: 'autoconcesion',
  REVOKE_ERROR: 'revocacion-error',
});

export function getPermissionDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_PERMISSION_SCENARIO;

  return Object.values(PERMISSION_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : PERMISSION_DEMO_SCENARIO.ACTIVE;
}
