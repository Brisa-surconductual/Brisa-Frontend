import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_VIEW_STATE,
  AGGREGATION_STATE,
  NO_DATA_REASON,
} from '../types/behavioralAggregate.js';
import {
  NOTIFICATION_AGGREGATE_DEMO_SCENARIO,
  getNotificationAggregateDemoScenario,
} from '../utils/notificationAggregateDemoScenario.js';
import {
  DEMO_NOTIFICATION_DATA,
  DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
  DEMO_NOTIFICATION_NO_SENDS,
  DEMO_NOTIFICATION_TIMESTAMP,
} from './notificationAggregateDemoData.js';

/*
 * FUENTE DE DEMOSTRACIÓN DE LA VISTA DE NOTIFICACIONES (solo desarrollo).
 * Solo la carga notificationAggregateSource.js mediante import() dinámico
 * cuando el modo demo está activo; en producción este módulo no llega al
 * build.
 *
 * Simula la respuesta del contrato de referencia de RF-134 para cada
 * escenario. No representa a M07 ni al backend real, y no depende de
 * ninguna otra fuente de agregados. Los mensajes son los de los flujos
 * alternos de RF-134; el resto es ficticio.
 */
export const NOTIFICATION_DEMO_DELAY_MS = 400;

const pause = () =>
  new Promise((resolve) => setTimeout(resolve, NOTIFICATION_DEMO_DELAY_MS));

const MESSAGE = Object.freeze({
  NOT_CONSOLIDATED:
    'La cohorte activa no cuenta todavía con métricas de efectividad de notificaciones consolidadas. La vista se mostrará cuando existan envíos registrados en la cohorte.',
  NOT_CALCULABLE_USERS:
    'Algunos usuarios de la cohorte no cuentan con métricas de efectividad calculables y fueron excluidos del promedio agregado.',
  UNAVAILABLE:
    'El módulo de notificaciones no está disponible en este momento. Se mostrará la última vista de efectividad disponible, si existe, marcada como desactualizada.',
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
 * Equivale a la operación del puerto de consulta de métricas agregadas
 * de notificaciones (RF-101): una sola lectura por cohorte. Devuelve la
 * respuesta del contrato o rechaza con `error.code` si la cohorte no
 * existe en la demostración.
 */
export async function getNotificationAggregate(cohortId) {
  const scenario = getNotificationAggregateDemoScenario();

  if (scenario === NOTIFICATION_AGGREGATE_DEMO_SCENARIO.LOADING)
    return new Promise(() => {});

  await pause();

  if (scenario === NOTIFICATION_AGGREGATE_DEMO_SCENARIO.ERROR) {
    throw new Error(
      'Error simulado al consultar la vista de notificaciones de demostración.',
    );
  }

  const datos = DEMO_NOTIFICATION_DATA[cohortId];

  if (!datos) {
    throw codedError(
      AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND,
      'Cohorte inexistente en la demostración.',
    );
  }

  const fecha = DEMO_NOTIFICATION_TIMESTAMP[cohortId];

  switch (scenario) {
    case NOTIFICATION_AGGREGATE_DEMO_SCENARIO.NO_SENDS:
      return response(cohortId, {
        ultimo_timestamp_disponible: fecha,
        datos: DEMO_NOTIFICATION_NO_SENDS,
      });

    case NOTIFICATION_AGGREGATE_DEMO_SCENARIO.NOT_CONSOLIDATED:
      return response(cohortId, {
        estado_agregacion: AGGREGATION_STATE.PENDING,
        motivo_sin_datos: NO_DATA_REASON.NOT_CONSOLIDATED,
        mensaje: MESSAGE.NOT_CONSOLIDATED,
      });

    case NOTIFICATION_AGGREGATE_DEMO_SCENARIO.NOT_CALCULABLE_USERS:
      return response(cohortId, {
        ultimo_timestamp_disponible: fecha,
        mensaje: MESSAGE.NOT_CALCULABLE_USERS,
        datos,
      });

    case NOTIFICATION_AGGREGATE_DEMO_SCENARIO.STALE:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.STALE,
        estado_agregacion: AGGREGATION_STATE.UPDATE_ERROR,
        ultimo_timestamp_disponible: fecha,
        mensaje: MESSAGE.UNAVAILABLE,
        datos,
      });

    case NOTIFICATION_AGGREGATE_DEMO_SCENARIO.NOT_AVAILABLE:
      return response(cohortId, {
        estado: AGGREGATE_VIEW_STATE.NOT_AVAILABLE,
        estado_agregacion: AGGREGATION_STATE.UPDATE_ERROR,
        mensaje: MESSAGE.UNAVAILABLE,
      });

    default:
      // Datos individuales añadidos a propósito: deben descartarse.
      return response(cohortId, {
        ultimo_timestamp_disponible: fecha,
        datos: { ...datos, ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS },
        ...DEMO_NOTIFICATION_FORBIDDEN_FIELDS,
      });
  }
}
