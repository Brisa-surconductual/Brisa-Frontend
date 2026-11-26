import {
  AGGREGATE_VIEW_STATUS,
  PROGRESS_LEVEL,
} from '../types/behavioralAggregate.js';
import {
  EXPORT_COLUMNS,
  EXPORT_NOT_AVAILABLE,
  EXPORT_VIEW_STATE,
} from '../types/cohortExport.js';
import { AUDIT_TIME_ZONE } from '../utils/formatAuditTimestamp.js';
import { toCsv } from '../utils/csv.js';

import { viewHasData } from './cohortDashboard.js';

/*
 * Proyección (DTO de lista blanca) de los indicadores exportables de
 * RF-144. Pura. Parte de las MISMAS vistas interpretadas que muestran
 * RF-132 y RF-134 (services/behavioralAggregateResponse.js y
 * services/notificationAggregateResponse.js), así que el CSV contiene los
 * mismos valores que ve el administrador.
 *
 * Cada columna se lee de forma explícita de un campo conocido: no se usa
 * Object.keys ni propagación de propiedades, de modo que cualquier campo
 * adicional de una fuente queda fuera. Nada se recalcula: los números se
 * conservan tal como llegan y un dato ausente es «No disponible», nunca 0.
 */
const value = (input) =>
  typeof input === 'number' && Number.isFinite(input)
    ? input
    : EXPORT_NOT_AVAILABLE;

const text = (input) =>
  typeof input === 'string' && input.trim()
    ? input.trim()
    : EXPORT_NOT_AVAILABLE;

const stateOf = (view) => {
  if (!viewHasData(view)) return EXPORT_VIEW_STATE.NOT_AVAILABLE;
  return view.status === AGGREGATE_VIEW_STATUS.STALE
    ? EXPORT_VIEW_STATE.STALE
    : EXPORT_VIEW_STATE.AVAILABLE;
};

const levelUsers = (distribution, level) =>
  Array.isArray(distribution)
    ? value(distribution.find((item) => item?.level === level)?.users)
    : EXPORT_NOT_AVAILABLE;

/*
 * `behavioralView` (RF-132) debe tener datos: es obligatorio. Si
 * `notificationView` (RF-134) no tiene datos, sus columnas quedan como
 * «No disponible» y su estado como NO_DISPONIBLE (RF-144, RF-149).
 * Devuelve un objeto congelado con exactamente las columnas de
 * EXPORT_COLUMNS.
 */
export function projectCohortIndicators({
  cohortName,
  behavioralView,
  notificationView,
}) {
  if (!viewHasData(behavioralView)) {
    throw new Error('La vista conductual es obligatoria para exportar.');
  }

  const b = behavioralView.data;
  const n = viewHasData(notificationView) ? notificationView.data : null;
  const distribution = b.progressDistribution;

  return Object.freeze({
    nombre_cohorte: text(cohortName),
    estado_vista_conductual: stateOf(behavioralView),
    fecha_actualizacion_conductual: text(b.updatedAt),
    total_usuarios_activos: value(b.activeUsers),
    usuarios_nivel_inicial: levelUsers(distribution, PROGRESS_LEVEL.INITIAL),
    usuarios_nivel_en_avance: levelUsers(
      distribution,
      PROGRESS_LEVEL.IN_PROGRESS,
    ),
    usuarios_nivel_avanzado: levelUsers(distribution, PROGRESS_LEVEL.ADVANCED),
    usuarios_nivel_completado: levelUsers(
      distribution,
      PROGRESS_LEVEL.COMPLETED,
    ),
    tasa_adherencia_promedio: value(b.averageAdherence),
    alertas_inactividad_pendientes: value(b.pendingInactivityAlerts),
    alertas_craving_pendientes: value(b.pendingCravingAlerts),
    estado_vista_notificaciones: stateOf(notificationView),
    // Misma fecha que muestra la vista de RF-134.
    fecha_actualizacion_notificaciones: n
      ? text(n.updatedAt ?? notificationView.lastAvailableAt)
      : EXPORT_NOT_AVAILABLE,
    tasa_apertura_promedio: n ? value(n.averageOpenRate) : EXPORT_NOT_AVAILABLE,
    tasa_conversion_promedio: n
      ? value(n.averageConversionRate)
      : EXPORT_NOT_AVAILABLE,
    total_notificaciones_enviadas: n
      ? value(n.sentNotifications)
      : EXPORT_NOT_AVAILABLE,
    total_notificaciones_entregadas: n
      ? value(n.deliveredNotifications)
      : EXPORT_NOT_AVAILABLE,
    total_notificaciones_descartadas: n
      ? value(n.discardedNotifications)
      : EXPORT_NOT_AVAILABLE,
  });
}

// Encabezado y una fila de datos, en el orden de EXPORT_COLUMNS.
export function buildCohortIndicatorsCsv(projection) {
  return toCsv([
    [...EXPORT_COLUMNS],
    EXPORT_COLUMNS.map((column) => projection[column]),
  ]);
}

// indicadores_cohorte_activa_YYYYMMDD.csv, con la fecha de Colombia.
export function cohortIndicatorsFileName(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: AUDIT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map(({ type, value: part }) => [type, part]),
  );

  return `indicadores_cohorte_activa_${parts.year}${parts.month}${parts.day}.csv`;
}
