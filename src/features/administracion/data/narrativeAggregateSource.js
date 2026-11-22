import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Puerto de la vista agregada de progresión narrativa (RF-133) que
 * consume el hook: una sola operación de lectura por cohorte, equivalente
 * a la interfaz de exposición de RF-117 (M06). Contrato de referencia:
 * GET /admin/cohortes/{id_cohorte}/vistas/narrativa (no se consulta).
 *
 * Es independiente de las demás vistas agregadas (RF-132, RF-134): no
 * las espera ni depende de su éxito, y su falla no las bloquea.
 *
 * Hoy solo existe la demostración de desarrollo; sin ella el modo es
 * PENDING_INTEGRATION y no se consulta nada. Al autorizarse la
 * integración, `getNarrativeAggregate` delegará en un adaptador de
 * `api/` con la misma firma. PENDIENTE de confirmar con el backend:
 *   - forma de identificar la cohorte (RF-133 habla de la cohorte
 *     activa; esta vista se consulta por cohorte);
 *   - `total_usuarios_cohorte` y `fecha_actualizacion` de RF-117/RF-133,
 *     ausentes del contrato de referencia;
 *   - cómo se marca a los usuarios excluidos (hoy, solo `mensaje`);
 *   - códigos de error (403, 404, 503) y su forma.
 * Un error nunca se responderá con datos ficticios.
 */
const NOT_INTEGRATED = 'La vista narrativa agregada aún no está integrada.';

/*
 * Único punto que carga la demostración de la vista narrativa. El import
 * dinámico está dentro de la condición del M08: en producción la rama se
 * elimina y ningún dato ficticio llega al build.
 */
async function loadNarrativeDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./narrativeAggregateDemoSource.js');
}

export function getNarrativeSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION;
}

// Respuesta del contrato de referencia, o rechazo con `error.code`.
export async function getNarrativeAggregate(cohortId) {
  return (await loadNarrativeDemoSource()).getNarrativeAggregate(cohortId);
}
