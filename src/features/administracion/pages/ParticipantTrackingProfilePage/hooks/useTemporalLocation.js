import { getParticipantTemporalLocation } from '../../../data/temporalLocationSource.js';
import { interpretTemporalLocationResponse } from '../../../services/temporalLocationResponse.js';

import { useProfileSectionQuery } from './useProfileSectionQuery.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({ getTemporal: getParticipantTemporalLocation });

/*
 * Ubicación temporal del participante en el programa (M04, RF-22 y
 * RF-22B), solo consulta, con su propia autorización explícita. No
 * calcula la unidad vigente, el tiempo transcurrido ni el efecto de las
 * pausas, y no modifica cronogramas, asignaciones ni pausas.
 */
export function useTemporalLocation({ cohortId, reference, enabled, source = DEFAULT_SOURCE } = {}) {
  const { data, ...section } = useProfileSectionQuery({
    cohortId,
    reference,
    enabled,
    query: source.getTemporal,
    interpret: interpretTemporalLocationResponse,
  });

  return { temporal: data, ...section };
}
