import { AGGREGATE_SOURCE_MODE } from '../types/behavioralAggregate.js';
import { isCohortDemoEnabled } from '../utils/cohortDemoMode.js';

/*
 * Puertos de la evolución temporal (RF-141) que consume el hook:
 * - getScheduleUnits(cohortId): catálogo de unidades temporales del
 *   cronograma de la cohorte (RF-55), con etiqueta y orden oficiales;
 * - getCohortEvolution(cohortId, { filters }): serie de RF-141 (RF-78).
 *
 * `filters` queda preparado para RF-135 (rango de fechas y modalidad
 * terapéutica), que aún no existe: se reenvía tal cual a la fuente, el
 * navegador nunca filtra ni recalcula datos y nada se guarda como
 * configuración permanente.
 *
 * Hoy solo existe la demostración de desarrollo; sin ella el modo es
 * PENDING_INTEGRATION y no se consulta nada. PENDIENTE de confirmar con
 * el backend: ruta del recurso, si el catálogo de unidades llega junto
 * con la serie, nombres de filtros_aplicados y códigos de error.
 */
const NOT_INTEGRATED = 'La evolución temporal aún no está integrada.';

/*
 * Único punto que carga la demostración de la evolución temporal. El
 * import dinámico está dentro de la condición del M08: en producción la
 * rama se elimina y ningún dato ficticio llega al build.
 */
async function loadEvolutionDemoSource() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_M08_DEMO === 'true')) {
    throw new Error(NOT_INTEGRATED);
  }

  return import('./cohortEvolutionDemoSource.js');
}

export function getEvolutionSourceMode() {
  return isCohortDemoEnabled()
    ? AGGREGATE_SOURCE_MODE.DEMO
    : AGGREGATE_SOURCE_MODE.PENDING_INTEGRATION;
}

export async function getScheduleUnits(cohortId) {
  return (await loadEvolutionDemoSource()).getScheduleUnits(cohortId);
}

export async function getCohortEvolution(cohortId, { filters = null } = {}) {
  return (await loadEvolutionDemoSource()).getCohortEvolution(cohortId, {
    filters,
  });
}
