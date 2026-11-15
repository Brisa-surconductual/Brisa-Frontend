import { getParticipantNotificationInteraction } from '../../../data/engagementSource.js';
import { interpretNotificationInteractionResponse } from '../../../services/notificationInteractionResponse.js';

import { useProfileSectionQuery } from './useProfileSectionQuery.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({ getInteraction: getParticipantNotificationInteraction });

/*
 * Interacción con notificaciones del participante (RF-131, M07), solo
 * consulta, con su propia autorización explícita (RF-102: el acceso
 * individual es distinto del de métricas agregadas; la autorización de
 * la ficha o de la progresión narrativa no la implica). No calcula
 * tasas ni muestra contenido de mensajes.
 */
export function useNotificationInteraction({ cohortId, reference, enabled, source = DEFAULT_SOURCE } = {}) {
  const { data, ...section } = useProfileSectionQuery({
    cohortId,
    reference,
    enabled,
    query: source.getInteraction,
    interpret: interpretNotificationInteractionResponse,
  });

  return { interaction: data, ...section };
}
