import {
  AGGREGATE_QUERY_ERROR,
  AGGREGATE_VIEW_STATE,
  AGGREGATE_VIEW_STATUS,
  AGGREGATION_STATE,
  NO_DATA_REASON,
  PROGRESS_LEVEL,
} from '../types/behavioralAggregate.js';
import { parseAuditTimestamp } from '../utils/formatAuditTimestamp.js';

/*
 * Interpreta la respuesta de la vista agregada conductual (RF-132).
 * Pura. Orden:
 * 1. Aislamiento: la respuesta debe declarar la cohorte pedida; si no,
 *    no se conserva ningún dato.
 * 2. Situación según `estado` y `motivo_sin_datos`. Un agregado
 *    suprimido nunca muestra datos, aunque lleguen.
 * 3. Lista explícita de campos oficiales de `datos` (RF-78): cualquier
 *    otro campo, incluido cualquier dato individual, se descarta.
 *
 * Ningún valor se calcula, suma, redondea, reescala ni completa: un dato
 * ausente o inválido es «no disponible» (null), nunca cero.
 */
const text = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const count = (value) => (Number.isInteger(value) && value >= 0 ? value : null);

const rate = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

// Fecha solo si es ISO 8601 válida; si no, se desconoce.
const timestamp = (value) => {
  const candidate = text(value);

  return candidate && parseAuditTimestamp(candidate) !== null
    ? candidate
    : null;
};

const LEVELS = Object.freeze(Object.values(PROGRESS_LEVEL));

/*
 * Distribución por nivel de RF-70, en el orden del catálogo. Cada nivel
 * conserva la cantidad tal como llega (null si falta o es inválida). Los
 * nombres `nivel` y `total_usuarios` son provisionales (ver datos de
 * demostración). Sin ningún nivel reconocible, la distribución es null.
 */
function distribution(value) {
  if (!Array.isArray(value)) return null;

  const levels = LEVELS.map((level) => {
    const item = value.find((entry) => entry?.nivel === level);

    return item
      ? Object.freeze({ level, users: count(item.total_usuarios) })
      : null;
  }).filter(Boolean);

  return levels.length > 0 ? Object.freeze(levels) : null;
}

function data(value) {
  return Object.freeze({
    activeUsers: count(value.total_usuarios_activos),
    progressDistribution: distribution(value.distribucion_niveles_progreso),
    averageAdherence: rate(value.tasa_adherencia_promedio),
    pendingInactivityAlerts: count(value.alertas_inactividad_pendientes),
    pendingCravingAlerts: count(value.alertas_craving_pendientes),
    updatedAt: timestamp(value.fecha_actualizacion),
  });
}

const result = (status, fields = {}) =>
  Object.freeze({
    status,
    data: null,
    lastAvailableAt: null,
    aggregationState: null,
    message: null,
    ...fields,
  });

function statusOf(estado, motivo, hasData) {
  if (motivo === NO_DATA_REASON.SUPPRESSED)
    return AGGREGATE_VIEW_STATUS.SUPPRESSED;

  if (!hasData) {
    if (motivo === NO_DATA_REASON.NOT_CONSOLIDATED) {
      return AGGREGATE_VIEW_STATUS.NOT_CONSOLIDATED;
    }

    return estado === AGGREGATE_VIEW_STATE.AVAILABLE
      ? AGGREGATE_VIEW_STATUS.ERROR
      : AGGREGATE_VIEW_STATUS.UNAVAILABLE;
  }

  if (estado === AGGREGATE_VIEW_STATE.AVAILABLE)
    return AGGREGATE_VIEW_STATUS.READY;
  if (estado === AGGREGATE_VIEW_STATE.STALE) return AGGREGATE_VIEW_STATUS.STALE;

  // NO_DISPONIBLE con datos es contradictorio: no se muestran.
  return AGGREGATE_VIEW_STATUS.ERROR;
}

export function interpretBehavioralAggregate(response, requestedCohortId) {
  if (!response || typeof response !== 'object') {
    return result(AGGREGATE_VIEW_STATUS.ERROR);
  }

  const cohortId = text(response.id_cohorte);

  if (!cohortId || cohortId !== requestedCohortId) {
    return result(AGGREGATE_VIEW_STATUS.INCONSISTENT);
  }

  if (!Object.values(AGGREGATE_VIEW_STATE).includes(response.estado)) {
    return result(AGGREGATE_VIEW_STATUS.ERROR);
  }

  const hasData = Boolean(response.datos) && typeof response.datos === 'object';
  const status = statusOf(response.estado, response.motivo_sin_datos, hasData);
  const showsData =
    status === AGGREGATE_VIEW_STATUS.READY ||
    status === AGGREGATE_VIEW_STATUS.STALE;

  return result(status, {
    data: showsData ? data(response.datos) : null,
    lastAvailableAt: showsData
      ? timestamp(response.ultimo_timestamp_disponible)
      : null,
    aggregationState: Object.values(AGGREGATION_STATE).includes(
      response.estado_agregacion,
    )
      ? response.estado_agregacion
      : null,
    message: text(response.mensaje),
  });
}

// Situación ante un rechazo de la fuente; por código, nunca por texto.
export const aggregateStatusFromError = (error) =>
  error?.code === AGGREGATE_QUERY_ERROR.COHORT_NOT_FOUND
    ? AGGREGATE_VIEW_STATUS.NOT_FOUND
    : AGGREGATE_VIEW_STATUS.ERROR;
