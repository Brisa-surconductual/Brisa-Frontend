import { useEffect, useState } from 'react';

import { getCohort, getCohortSourceMode } from '../../../data/cohortSource.js';
import { listCohortParticipants } from '../../../data/participantSource.js';
import { countParticipantsByStatus } from '../../../services/participantSummary.js';
import { COHORT_SOURCE_MODE } from '../../../types/cohortSourceMode.js';

export const COHORT_LIST_PATH = '/app/administrativo/cohortes';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getCohortSourceMode,
  getCohort,
  listParticipants: listCohortParticipants,
});

export const COHORT_DETAIL_ERROR_MESSAGE =
  'No pudimos cargar la cohorte. Intenta nuevamente.';
export const PARTICIPANTS_ERROR_MESSAGE =
  'No pudimos cargar los participantes de la cohorte. Intenta nuevamente.';

/*
 * Detalle de una cohorte y consulta de sus participantes (RF-125).
 * No asigna ni retira por sí mismo: `addParticipants` y
 * `removeParticipant` solo reflejan en la lista lo que ya resolvió la
 * fuente al asignar o retirar. Presenta los estados tal como los informa la fuente, sin calcular
 * la elegibilidad. Distingue carga, cohorte inexistente, error de la
 * cohorte, error de los participantes, lista vacía e integración
 * pendiente; un fallo nunca se reemplaza por datos ficticios.
 * `source` permite sustituir la fuente sin cambiar la página.
 */
export function useCohortDetail({ cohortId, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending = mode === COHORT_SOURCE_MODE.PENDING_INTEGRATION;
  const isParticipantsIntegrationPending = mode === COHORT_SOURCE_MODE.API;

  const [cohort, setCohort] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    async function load() {
      setIsLoading(true);
      setLoadError('');
      setNotFound(false);
      setParticipantsError('');

      const [cohortResult, participantsResult] = await Promise.allSettled([
        source.getCohort(cohortId),
        isParticipantsIntegrationPending ? [] : source.listParticipants(cohortId),
      ]);
      if (!active) return;

      if (cohortResult.status === 'rejected') {
        setCohort(null);
        setParticipants([]);
        setLoadError(COHORT_DETAIL_ERROR_MESSAGE);
      } else if (!cohortResult.value || (participantsResult.status === 'fulfilled' && participantsResult.value === null)) {
        // RF-125: la cohorte seleccionada no existe.
        setCohort(null);
        setParticipants([]);
        setNotFound(true);
      } else {
        setCohort(cohortResult.value);

        if (participantsResult.status === 'rejected') {
          setParticipants([]);
          setParticipantsError(PARTICIPANTS_ERROR_MESSAGE);
        } else {
          setParticipants(Array.isArray(participantsResult.value) ? participantsResult.value : []);
        }
      }

      setIsLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isIntegrationPending, isParticipantsIntegrationPending, source]);

  return {
    cohort,
    participants,
    participationCounts: countParticipantsByStatus(participants),
    isLoading,
    loadError,
    notFound,
    participantsError,
    isDemo: mode === COHORT_SOURCE_MODE.DEMO,
    isIntegrationPending,
    isParticipantsIntegrationPending,
    // Asignar solo con una fuente que lo admita (hoy, la demostración).
    canManage: mode === COHORT_SOURCE_MODE.DEMO,
    retry: () => setAttempt((value) => value + 1),
    // Añade (o reemplaza, sin duplicar) los participantes asignados.
    addParticipants: (assigned) =>
      setParticipants((current) => [
        ...current.filter(({ id }) => !assigned.some((participant) => participant.id === id)),
        ...assigned,
      ]),
    // Quita de la lista al participante que la fuente ya retiró.
    removeParticipant: (participantId) =>
      setParticipants((current) => current.filter(({ id }) => id !== participantId)),
  };
}
