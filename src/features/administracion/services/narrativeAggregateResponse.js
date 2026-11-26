import { NARRATIVE_PHASE } from '../types/narrativeAggregate.js';

import {
  count,
  interpretAggregateEnvelope,
  timestamp,
} from './aggregateViewEnvelope.js';

/*
 * Interpreta la respuesta de la vista agregada de progresión narrativa
 * (RF-133, datos de M06 vía RF-117). Pura. El aislamiento por cohorte y
 * la situación de la vista los resuelve la envoltura común de RF-78
 * (services/aggregateViewEnvelope.js), la misma de RF-132; aquí solo se
 * aplica la LISTA EXPLÍCITA de campos de `datos`:
 *   distribucion_por_fase_narrativa, total_usuarios_programa_completado,
 *   total_usuarios_con_logros, total_logros_desbloqueados y, si llegan,
 *   total_usuarios_cohorte y fecha_actualizacion (definidos en
 *   RF-133/RF-117, ausentes del contrato de referencia).
 * Cualquier otro campo (perfiles, capítulos, logros específicos,
 * identificadores) se descarta.
 *
 * Ningún valor se calcula, suma, redondea ni completa: un dato ausente o
 * inválido es «no disponible» (null), nunca cero. Las fases no se suman
 * ni se comparan con el total de la cohorte.
 */
const PHASES = Object.freeze(Object.values(NARRATIVE_PHASE));

/*
 * Distribución por fase narrativa, siempre en el orden INICIO,
 * DESARROLLO, CIERRE. Una fase que no llega queda en null («no
 * disponible»), no en cero. Una fase desconocida (p. ej. SIN_AVANCE,
 * que RF-117 deja a configuración) se ignora. Sin ninguna fase
 * reconocible, la distribución es null.
 */
function phaseDistribution(value) {
  if (!Array.isArray(value)) return null;

  const items = PHASES.map((phase) => {
    const item = value.find((entry) => entry?.fase === phase);

    return item ? Object.freeze({ phase, users: count(item.total) }) : null;
  });

  if (items.every((item) => item === null)) return null;

  return Object.freeze(
    items.map(
      (item, index) =>
        item ?? Object.freeze({ phase: PHASES[index], users: null }),
    ),
  );
}

function data(value) {
  return Object.freeze({
    phaseDistribution: phaseDistribution(value.distribucion_por_fase_narrativa),
    cohortUsers: count(value.total_usuarios_cohorte),
    completedProgramUsers: count(value.total_usuarios_programa_completado),
    usersWithAchievements: count(value.total_usuarios_con_logros),
    unlockedAchievements: count(value.total_logros_desbloqueados),
    updatedAt: timestamp(value.fecha_actualizacion),
  });
}

export function interpretNarrativeAggregate(response, requestedCohortId) {
  return interpretAggregateEnvelope(response, requestedCohortId, data);
}

export { aggregateStatusFromError } from './aggregateViewEnvelope.js';
