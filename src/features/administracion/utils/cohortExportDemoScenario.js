/*
 * Escenarios de la exportación CSV de demostración
 * (VITE_M08_EXPORT_SCENARIO). Solo los usa la fuente de demostración, que
 * no llega al build de producción.
 *
 * - exito (predeterminado): exporta los indicadores de RF-132 y RF-134;
 * - sin-permiso: FA1 (403);
 * - error-generacion: FA5 (500), sin archivo;
 * - auditoria-falla: la bitácora SIMULADA no registra: sin descarga;
 * - intento-pii: la petición pide include_pii=true y las vistas traen
 *   campos individuales; el CSV debe salir igual de sanitizado (FA4).
 *
 * Los demás casos se reproducen con los escenarios ya existentes:
 * notificaciones no disponibles (VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO
 * =no-disponible), sin indicadores (VITE_M08_AGGREGATE_SCENARIO
 * =sin-consolidar), cohorte inactiva (Cohorte Piloto C), valores nulos
 * (VITE_M08_NOTIFICATIONS_AGGREGATE_SCENARIO=sin-envios) y caracteres
 * especiales (editando el nombre de la cohorte en la demostración).
 */
export const EXPORT_DEMO_SCENARIO = Object.freeze({
  SUCCESS: 'exito',
  FORBIDDEN: 'sin-permiso',
  GENERATION_ERROR: 'error-generacion',
  AUDIT_FAILURE: 'auditoria-falla',
  PII_ATTEMPT: 'intento-pii',
});

export function getExportDemoScenario(env = import.meta.env) {
  const scenario = env.VITE_M08_EXPORT_SCENARIO;

  return Object.values(EXPORT_DEMO_SCENARIO).includes(scenario)
    ? scenario
    : EXPORT_DEMO_SCENARIO.SUCCESS;
}
