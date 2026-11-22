import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Puerto de la vista agregada de efectividad de notificaciones (RF-134)
 * que consume el hook: una sola operación de lectura por cohorte,
 * equivalente a la interfaz de exposición de RF-101 (M07). Contrato de
 * referencia: GET /admin/cohortes/{id_cohorte}/vistas/notificaciones
 * (no se consulta).
 *
 * Es independiente de las demás vistas agregadas (RF-132, RF-133): no
 * las espera ni depende de su éxito, y su falla no las bloquea.
 *
 * Hoy solo existe la demostración de desarrollo; sin ella el modo es
 * PENDING_INTEGRATION y no se consulta nada. Al autorizarse la
 * integración, `getNotificationAggregate` delegará en un adaptador de
 * `api/` con la misma firma. PENDIENTE de confirmar con el backend:
 *   - forma de identificar la cohorte (RF-134 habla de la cohorte
 *     activa; esta vista se consulta por cohorte);
 *   - `fecha_actualizacion` de RF-134/RF-101, ausente del contrato de
 *     referencia;
 *   - definición de «descartadas»: RF-134 las describe como no
 *     entregadas (fallidas, expiradas o canceladas); RF-100 y RF-101,
 *     como interacción DESCARTADA de RF-98, sin canceladas ni expiradas;
 *   - cómo llega una tasa no calculable (hoy, null);
 *   - códigos de error (403, 404, 503) y su forma.
 * Un error nunca se responderá con datos ficticios.
 */
const NOT_INTEGRATED =
  'La vista de efectividad de notificaciones aún no está integrada.';

/*
 * Único punto que carga la demostración de la vista de notificaciones.
 * El import dinámico está dentro de la condición del M08: en producción
 * la rama se elimina y ningún dato ficticio llega al build.
 */
async function loadNotificationDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./notificationAggregateDemoSource.js');
}

export function getNotificationAggregateSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION;
}

// Respuesta del contrato de referencia, o rechazo con `error.code`.
export async function getNotificationAggregate(cohortId) {
  return (await loadNotificationDemoSource()).getNotificationAggregate(
    cohortId,
  );
}
