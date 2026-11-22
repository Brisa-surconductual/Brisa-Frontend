import {
  count,
  interpretAggregateEnvelope,
  timestamp,
} from './aggregateViewEnvelope.js';

/*
 * Interpreta la respuesta de la vista agregada de efectividad de
 * notificaciones (RF-134, datos de M07 vía RF-101). Pura. El aislamiento
 * por cohorte y la situación de la vista los resuelve la envoltura común
 * de RF-78 (services/aggregateViewEnvelope.js), la misma de RF-132 y
 * RF-133; aquí solo se aplica la LISTA EXPLÍCITA de campos de `datos`:
 *   tasa_apertura_promedio, tasa_conversion_promedio,
 *   total_notificaciones_enviadas, total_notificaciones_entregadas,
 *   total_notificaciones_descartadas y, si llega, fecha_actualizacion
 *   (definida en RF-134/RF-101, ausente del contrato de referencia).
 * Cualquier otro campo (métricas por usuario, historial, contenido o
 * tipo de mensajes, identificadores, tasa de descarte) se descarta.
 *
 * Nada se calcula: las tasas se conservan tal como llegan (proporciones
 * de RF-100, sin convertir a porcentaje) y los totales no se comparan
 * entre sí. Una tasa null, NO_CALCULABLE o inválida es «no disponible»
 * (null), nunca cero; un total en cero es un cero real.
 */
const rate = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

function data(value) {
  return Object.freeze({
    averageOpenRate: rate(value.tasa_apertura_promedio),
    averageConversionRate: rate(value.tasa_conversion_promedio),
    sentNotifications: count(value.total_notificaciones_enviadas),
    deliveredNotifications: count(value.total_notificaciones_entregadas),
    discardedNotifications: count(value.total_notificaciones_descartadas),
    updatedAt: timestamp(value.fecha_actualizacion),
  });
}

export function interpretNotificationAggregate(response, requestedCohortId) {
  return interpretAggregateEnvelope(response, requestedCohortId, data);
}

export { aggregateStatusFromError } from './aggregateViewEnvelope.js';
