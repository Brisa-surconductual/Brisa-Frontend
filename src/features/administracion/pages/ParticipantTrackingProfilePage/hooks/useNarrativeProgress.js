import { getParticipantNarrativeProgress } from '../../../data/engagementSource.js';
import { interpretNarrativeProgressResponse } from '../../../services/narrativeProgressResponse.js';

import { useProfileSectionQuery } from './useProfileSectionQuery.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({ getNarrative: getParticipantNarrativeProgress });

/*
 * Progresión narrativa del participante (RF-130, M06), solo consulta,
 * con su propia autorización explícita: la de la ficha, el historial o
 * las notificaciones no la implican. No calcula fases, capítulos,
 * niveles ni logros.
 */
export function useNarrativeProgress({ cohortId, reference, enabled, source = DEFAULT_SOURCE } = {}) {
  const { data, ...section } = useProfileSectionQuery({
    cohortId,
    reference,
    enabled,
    query: source.getNarrative,
    interpret: interpretNarrativeProgressResponse,
  });

  return { narrative: data, ...section };
}
