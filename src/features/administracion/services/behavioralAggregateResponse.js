import { PROGRESS_LEVEL } from '../types/behavioralAggregate.js';

import {
  count,
  interpretAggregateEnvelope,
  timestamp,
} from './aggregateViewEnvelope.js';

/*
 * Interpreta la respuesta de la vista agregada conductual (RF-132).
 * Pura. El aislamiento por cohorte y la situación de la vista los
 * resuelve la envoltura común (services/aggregateViewEnvelope.js); aquí
 * solo se aplica la lista explícita de campos oficiales de `datos`
 * (RF-78): cualquier otro campo, incluido cualquier dato individual, se
 * descarta.
 *
 * Ningún valor se calcula, suma, redondea, reescala ni completa: un dato
 * ausente o inválido es «no disponible» (null), nunca cero.
 */
const rate = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

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

export function interpretBehavioralAggregate(response, requestedCohortId) {
  return interpretAggregateEnvelope(response, requestedCohortId, data);
}

export { aggregateStatusFromError } from './aggregateViewEnvelope.js';
