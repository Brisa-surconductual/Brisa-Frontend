import { SECTION_OUTCOME } from '../types/participantEngagement.js';

import { checkSectionEnvelope, textOrNull } from './profileSectionResponse.js';

/*
 * Interpretación de la progresión narrativa individual (RF-130, datos
 * expuestos por M06 mediante RF-116). Pura.
 *
 * 1. Autorización explícita propia y aislamiento por cohorte y
 *    referencia (services/profileSectionResponse).
 * 2. Sin progresión (`narrative` ausente): equivale al 204 de RF-130.
 * 3. LISTA EXPLÍCITA de campos: activePhaseName, lastCompletedChapterName
 *    y achievements [{ name, unlockedAt }]. Se descartan los UUID del
 *    perfil, la fase y el capítulo, el nivel de gamificación, el estado
 *    de progresión y la fecha de actualización de RF-116: RF-130 no los
 *    pide y la interfaz no los muestra.
 * 4. Nada se calcula ni se completa: una fase o capítulo ausentes quedan
 *    en null; una lista de logros ausente (null) es «no disponible» y
 *    una lista vacía es «sin logros».
 *
 * PENDIENTE de contrato: RF-130 solo define id_capitulo_completado
 * (UUID), que nunca se muestra. La interfaz necesita un nombre legible
 * del capítulo; aquí se supone `lastCompletedChapterName`.
 *
 * Forma PROVISIONAL de la respuesta:
 *   { access, cohortId, reference, narrative: { activePhaseName,
 *     lastCompletedChapterName, achievements: [{ name, unlockedAt }] }
 *     | null }
 */
function toAchievements(value) {
  if (!Array.isArray(value)) return null;

  return Object.freeze(
    value.map((item) => Object.freeze({
      name: item && typeof item === 'object' ? textOrNull(item.name) : null,
      unlockedAt: item && typeof item === 'object' ? textOrNull(item.unlockedAt) : null,
    })),
  );
}

export function interpretNarrativeProgressResponse(response, request) {
  const blocked = checkSectionEnvelope(response, request);

  if (blocked) return Object.freeze({ outcome: blocked });

  const { narrative } = response;

  if (narrative === null || narrative === undefined) return Object.freeze({ outcome: SECTION_OUTCOME.EMPTY });

  if (typeof narrative !== 'object' || Array.isArray(narrative)) return Object.freeze({ outcome: SECTION_OUTCOME.MALFORMED });

  return Object.freeze({
    outcome: SECTION_OUTCOME.OK,
    data: Object.freeze({
      activePhaseName: textOrNull(narrative.activePhaseName),
      lastCompletedChapterName: textOrNull(narrative.lastCompletedChapterName),
      achievements: toAchievements(narrative.achievements),
    }),
  });
}
