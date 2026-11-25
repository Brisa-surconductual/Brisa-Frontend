/*
 * Escenarios de los permisos de acceso individual de demostración
 * (VITE_M08_PERMISSION_SCENARIO). Solo los usa la fuente de demostración,
 * que no llega al build de producción.
 *
 * - vigentes (predeterminado): P-1A2B3C4D con dos permisos vigentes, uno
 *   vencido y uno revocado (estos dos no deben aparecer); P-5E6F7A8B sin
 *   permisos; P-9C0D1E2F con 25 (dos páginas); un código desconocido da
 *   lista vacía en el GET y 404 al conceder. El coordinador de la demo es
 *   DEMO_CURRENT_USER_ID (conceder a ese id da 422 de autoconcesión);
 * - vacio: P-1A2B3C4D sin permisos;
 * - carga: la lista no termina de cargar;
 * - error: la lista falla;
 * - conflicto: conceder responde 409 PERMISO_YA_VIGENTE, con mensaje del servidor;
 * - autoconcesion: conceder responde 422 AUTOCONCESION_NO_PERMITIDA;
 * - rol-invalido: conceder responde 422 ROL_INVALIDO_PARA_OPERACION, con mensaje;
 * - vigencia-invalida: conceder responde 422 VIGENCIA_INVALIDA;
 * - revocacion-error: revocar falla sin respuesta del servidor;
 * - revocacion-revocado: revocar responde 409 PERMISO_YA_REVOCADO;
 * - revocacion-inexistente: revocar responde 404 PERMISO_NO_ENCONTRADO.
 */
export const PERMISSION_DEMO_SCENARIO = Object.freeze({
  ACTIVE: 'vigentes',
  EMPTY: 'vacio',
  LOADING: 'carga',
  ERROR: 'error',
  CONFLICT: 'conflicto',
  SELF_GRANT: 'autoconcesion',
  INVALID_ROLE: 'rol-invalido',
  INVALID_VALIDITY: 'vigencia-invalida',
  REVOKE_ERROR: 'revocacion-error',
  REVOKE_REVOKED: 'revocacion-revocado',
  REVOKE_MISSING: 'revocacion-inexistente',
});

export function getPermissionDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_PERMISSION_SCENARIO;

  return Object.values(PERMISSION_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : PERMISSION_DEMO_SCENARIO.ACTIVE;
}
