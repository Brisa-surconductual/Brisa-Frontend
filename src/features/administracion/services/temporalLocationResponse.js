import { SECTION_OUTCOME } from '../types/participantEngagement.js';

import { checkSectionEnvelope, textOrNull } from './profileSectionResponse.js';

/*
 * Interpretación de la consulta temporal del participante (M04). Pura.
 *
 * 1. Autorización explícita propia y aislamiento por cohorte y
 *    referencia (services/profileSectionResponse), como RF-130 y RF-131.
 * 2. Sin información (`temporal` ausente): sin cronograma asignado.
 * 3. LISTA EXPLÍCITA de campos, con fundamento documental:
 *    - currentUnitName: nombre de la unidad temporal vigente (RF-22);
 *    - effectiveElapsedSeconds: tiempo efectivo transcurrido, ya
 *      descontadas las pausas por el backend (RF-22); entero ≥ 0;
 *    - programFinished: indicador de cronograma finalizado (RF-22);
 *    - pauses [{ status, startsAt, endsAt }]: pausas administrativas
 *      (RF-22B: estado_pausa, fecha_inicio_pausa, fecha_fin_pausa).
 *    Se descartan identificadores (usuario, cronograma, unidad, pausa,
 *    administrador), correos, la fecha de inicio del programa y el
 *    motivo de la pausa (texto libre que podría contener información
 *    privada; PENDIENTE de decidir si un administrador debe verlo aquí).
 * 4. Nada se calcula: ni la unidad vigente, ni el tiempo, ni el efecto
 *    de las pausas. Un valor inválido queda en null («No disponible»).
 *
 * Forma PROVISIONAL de la respuesta:
 *   { access, cohortId, reference, temporal: { currentUnitName,
 *     effectiveElapsedSeconds, programFinished, pauses } | null }
 */
function toPauses(value) {
  if (!Array.isArray(value)) return null;

  return Object.freeze(
    value.map((pause) => {
      const item = pause && typeof pause === 'object' ? pause : {};

      return Object.freeze({
        status: textOrNull(item.status),
        startsAt: textOrNull(item.startsAt),
        endsAt: textOrNull(item.endsAt),
      });
    }),
  );
}

export function interpretTemporalLocationResponse(response, request) {
  const blocked = checkSectionEnvelope(response, request);

  if (blocked) return Object.freeze({ outcome: blocked });

  const { temporal } = response;

  if (temporal === null || temporal === undefined) return Object.freeze({ outcome: SECTION_OUTCOME.EMPTY });

  if (typeof temporal !== 'object' || Array.isArray(temporal)) return Object.freeze({ outcome: SECTION_OUTCOME.MALFORMED });

  const seconds = temporal.effectiveElapsedSeconds;

  return Object.freeze({
    outcome: SECTION_OUTCOME.OK,
    data: Object.freeze({
      currentUnitName: textOrNull(temporal.currentUnitName),
      effectiveElapsedSeconds: Number.isInteger(seconds) && seconds >= 0 ? seconds : null,
      programFinished: typeof temporal.programFinished === 'boolean' ? temporal.programFinished : null,
      pauses: toPauses(temporal.pauses),
    }),
  });
}
