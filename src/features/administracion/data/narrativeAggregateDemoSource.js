import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_VIEW_STATE,
  AGGREGATION_STATE,
  NO_DATA_REASON,
} from '../types/behavioralAggregate.js';
import {
  NARRATIVE_AGGREGATE_DEMO_SCENARIO,
  getNarrativeAggregateDemoScenario,
} from '../utils/narrativeAggregateDemoScenario.js';
import {
  DEMO_NARRATIVE_DATA,
  DEMO_NARRATIVE_FORBIDDEN_FIELDS,
  DEMO_NARRATIVE_TIMESTAMP,
} from './narrativeAggregateDemoData.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE LA VISTA NARRATIVA (solo desarrollo). Solo la
 * carga narrativeAggregateSource.js mediante import() dinámico cuando el
 * modo demo está activo; en producción este módulo no llega al build.
 *
 * Simula la respuesta del contrato de referencia de RF-133 para cada
 * escenario. No representa a M06 ni al backend real, y no depende de
 * ninguna otra fuente de agregados. Los mensajes son los de los flujos
 * alternos de RF-133; el resto es ficticio.
 */
export const NARRATIVE_DEMO_DELAY_MS = 400;

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, NARRATIVE_DEMO_DELAY_MS));

const MESSAGE = Object.freeze({
  NOT_CONSOLIDATED:
    'La cohorte activa no cuenta todavía con progresión narrativa consolidada. La vista se mostrará cuando existan perfiles narrativos activos en la cohorte.',
  EXCLUDED_USERS:
    'Algunos usuarios de la cohorte no cuentan con perfil narrativo activo y no se incluyen en la distribución por fase.',
  UNAVAILABLE:
    'El módulo de gamificación no está disponible en este momento. Se mostrará la última vista narrativa agregada disponible, si existe, marcada como desactualizada.',
});

function codedError(code, message) {
  return Object.assign(new Error(message), { code });
}

const response = (cohortId, fields) => ({
  id_cohorte: cohortId,
  estado: AGGREGATE_VIEW_STATE.AVAILABLE,
  estado_agregacion: AGGREGATION_STATE.UPDATED,
  ultimo_timestamp_disponible: null,
  motivo_sin_datos: null,
  mensaje: null,
  datos: null,
  ...fields,
});

const notConsolidated = (cohortId, estadoAgregacion) =>
  response(cohortId, {
    estado_agregacion: estadoAgregacion,
    motivo_sin_datos: NO_DATA_REASON.NOT_CONSOLIDATED,
    mensaje: MESSAGE.NOT_CONSOLIDATED,
  });

/*
 * Equivale a la operación del puerto de consulta de agregados narrativos
 * (RF-117): una sola lectura por cohorte. Devuelve la respuesta del
 * contrato o rechaza con `error.code` si la cohorte no existe en la
 * demostración.
 */
export async function getNarrativeAggregate(cohortId) {
  const scenario = getNarrativeAggregateDemoScenario();

  if (scenario === NARRATIVE_AGGREGATE_DEMO_SCENARIO.LOADING)
    return new Promise(() => {});

  await pause();

  if (scenario === NARRATIVE_AGGREGATE_DEMO_SCENARIO.ERROR) {
    throw new Error(
      'Error simulado al consultar la vista narrativa de demostración.',
    );
  }

  if (!Object.hasOwn(DEMO_NARRATIVE_DATA, cohortId)) {
    throw codedError(
      AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
      'Cohorte inexistente en la demostración.',
    );
  }

  const datos = DEMO_NARRATIVE_DATA[cohortId];
  const fecha = DEMO_NARRATIVE_TIMESTAMP[cohortId];

  if (scenario === NARRATIVE_AGGREGATE_DEMO_SCENARIO.NOT_CONSOLIDATED) {
    return notConsolidated(cohortId, AGGREGATION_STATE.PENDING);
  }

  // Sin perfiles narrativos activos: la agregación corrió, sin métricas.
  if (scenario === NARRATIVE_AGGREGATE_DEMO_SCENARIO.NO_METRICS || !datos) {
    return notConsolidated(cohortId, AGGREGATION_STATE.UPDATED);
  }

  switch (scenario) {
    case NARRATIVE_AGGREGATE_DEMO_SCENARIO.EXCLUDED_USERS:
      return response(cohortId, {
        ultimo_timestamp_disponible: fecha,
        mensaje: MESSAGE.EXCLUDED_USERS,
        datos,
      });

    case NARRATIVE_AGGREGATE_DEMO_SCENARIO.STALE:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.STALE,
        estado_agregacion: AGGREGATION_STATE.UPDATE_ERROR,
        ultimo_timestamp_disponible: fecha,
        mensaje: MESSAGE.UNAVAILABLE,
        datos,
      });

    case NARRATIVE_AGGREGATE_DEMO_SCENARIO.NOT_AVAILABLE:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.NOT_AVAILABLE,
        estado_agregacion: AGGREGATION_STATE.UPDATE_ERROR,
        mensaje: MESSAGE.UNAVAILABLE,
      });

    default:
      // Datos individuales añadidos a propósito: deben descartarse.
      return response(cohortId, {
        ultimo_timestamp_disponible: fecha,
        datos: { ...datos, ...DEMO_NARRATIVE_FORBIDDEN_FIELDS },
        ...DEMO_NARRATIVE_FORBIDDEN_FIELDS,
      });
  }
}
