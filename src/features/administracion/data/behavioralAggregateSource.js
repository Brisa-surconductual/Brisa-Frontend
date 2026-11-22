import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Puerto de la vista agregada conductual (RF-132) que consume el hook.
 * Equivale, en el frontend, a `SeguimientoAgregadoPort.obtener(id_cohorte)`
 * del contrato de referencia: una sola operación de lectura por cohorte.
 *
 * Hoy solo existe la demostración de desarrollo; sin ella el modo es
 * PENDING_INTEGRATION y no se consulta nada. Al autorizarse la
 * integración, `getBehavioralAggregate` delegará en un adaptador de
 * `api/` con la misma firma. PENDIENTE de confirmar con el backend:
 *   - ruta del recurso y forma de identificar la cohorte (RF-132 habla de
 *     la cohorte activa; esta vista se consulta por cohorte);
 *   - nombres de los campos de cada elemento de la distribución;
 *   - escala de la tasa de adherencia promedio;
 *   - códigos de error (403, 404) y su forma.
 * Un error nunca se responderá con datos ficticios.
 */
const NOT_INTEGRATED = 'La vista agregada conductual aún no está integrada.';

/*
 * Único punto que carga la demostración de la vista agregada. El import
 * dinámico está dentro de la condición del M08: en producción la rama se
 * elimina y ningún dato ficticio llega al build.
 */
async function loadAggregateDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./behavioralAggregateDemoSource.js');
}

export function getAggregateSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION;
}

// Respuesta del contrato de referencia, o rechazo con `error.code`.
export async function getBehavioralAggregate(cohortId) {
  return (await loadAggregateDemoSource()).getBehavioralAggregate(cohortId);
}
