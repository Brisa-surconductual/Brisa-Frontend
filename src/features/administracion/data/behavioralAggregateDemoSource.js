import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_VIEW_STATE,
  AGGREGATION_STATE,
  NO_DATA_REASON,
} from '../types/behavioralAggregate.js';
import {
  AGGREGATE_DEMO_SCENARIO,
  getAggregateDemoScenario,
} from '../utils/behavioralAggregateDemoScenario.js';
import {
  DEMO_AGGREGATE_DATA,
  DEMO_FORBIDDEN_FIELDS,
} from './behavioralAggregateDemoData.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE LA VISTA AGREGADA (solo desarrollo). Solo la
 * carga behavioralAggregateSource.js mediante import() dinámico cuando el
 * modo demo está activo; en producción este módulo no llega al build.
 *
 * Simula la respuesta del contrato de referencia de RF-132 para cada
 * escenario. No representa a M05 ni al backend real. Los mensajes son los
 * de los flujos alternos de RF-132; el resto es ficticio.
 */
export const AGGREGATE_DEMO_DELAY_MS = 400;

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, AGGREGATE_DEMO_DELAY_MS));

const MESSAGE = Object.freeze({
  NOT_CONSOLIDATED:
    'La cohorte activa no cuenta todavía con indicadores consolidados. La vista se mostrará cuando M05 complete su primer ciclo de consolidación.',
  UNAVAILABLE:
    'El módulo de seguimiento no está disponible en este momento. Se mostrará la última vista agregada disponible, si existe, marcada como desactualizada.',
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

/*
 * Equivale a `SeguimientoAgregadoPort.obtener(id_cohorte)`. Devuelve la
 * respuesta del contrato o rechaza con `error.code` si la cohorte no
 * existe en la demostración.
 */
export async function getBehavioralAggregate(cohortId) {
  const scenario = getAggregateDemoScenario();

  if (scenario === AGGREGATE_DEMO_SCENARIO.LOADING)
    return new Promise(() => {});

  await pause();

  if (scenario === AGGREGATE_DEMO_SCENARIO.ERROR) {
    throw new Error(
      'Error simulado al consultar la vista agregada de demostración.',
    );
  }

  const datos = DEMO_AGGREGATE_DATA[cohortId];

  if (!datos) {
    throw codedError(
      AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
      'Cohorte inexistente en la demostración.',
    );
  }

  switch (scenario) {
    case AGGREGATE_DEMO_SCENARIO.NOT_CONSOLIDATED:
      return response(cohortId, {
        estado_agregacion: AGGREGATION_STATE.PENDING,
        motivo_sin_datos: NO_DATA_REASON.NOT_CONSOLIDATED,
        mensaje: MESSAGE.NOT_CONSOLIDATED,
      });

    case AGGREGATE_DEMO_SCENARIO.STALE:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.STALE,
        estado_agregacion: AGGREGATION_STATE.UPDATE_ERROR,
        ultimo_timestamp_disponible: datos.fecha_actualizacion,
        mensaje: MESSAGE.UNAVAILABLE,
        datos,
      });

    case AGGREGATE_DEMO_SCENARIO.SUPPRESSED:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.NOT_AVAILABLE,
        motivo_sin_datos: NO_DATA_REASON.SUPPRESSED,
      });

    case AGGREGATE_DEMO_SCENARIO.NOT_AVAILABLE:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.NOT_AVAILABLE,
        estado_agregacion: AGGREGATION_STATE.UPDATE_ERROR,
        mensaje: MESSAGE.UNAVAILABLE,
      });

    default:
      // Campos individuales añadidos a propósito: deben descartarse.
      return response(cohortId, {
        ultimo_timestamp_disponible: datos.fecha_actualizacion,
        datos: { ...datos, ...DEMO_FORBIDDEN_FIELDS },
        ...DEMO_FORBIDDEN_FIELDS,
      });
  }
}
