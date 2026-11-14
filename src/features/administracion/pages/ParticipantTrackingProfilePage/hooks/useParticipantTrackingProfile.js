import { useEffect, useRef, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import { getParticipantTrackingProfile, getTrackingSourceMode } from '../../../data/trackingSource.js';
import { interpretProfileResponse } from '../../../services/trackingProfileResponse.js';
import {
  PROFILE_OUTCOME,
  TRACKING_QUERY_ERROR,
  TRACKING_SOURCE_MODE,
} from '../../../types/participantTracking.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getTrackingSourceMode,
  getCohort,
  getProfile: getParticipantTrackingProfile,
});

/*
 * Situación de la ficha. Equivalencias documentales con RF-128:
 * NO_PROFILE 204, DENIED 403, NOT_FOUND 404, INCONSISTENT 409,
 * UNAVAILABLE 503, ERROR 500. OUTSIDE_COHORT y COHORT_NOT_FOUND no
 * tienen código en RF-128 (decisión provisional de la interfaz).
 */
export const PROFILE_STATUS = Object.freeze({
  READY: 'READY',
  NO_PROFILE: 'NO_PROFILE',
  DENIED: 'DENIED',
  NOT_FOUND: 'NOT_FOUND',
  COHORT_NOT_FOUND: 'COHORT_NOT_FOUND',
  OUTSIDE_COHORT: 'OUTSIDE_COHORT',
  INCONSISTENT: 'INCONSISTENT',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR',
});

const STATUS_BY_CODE = Object.freeze({
  [TRACKING_QUERY_ERROR.ACCESS_DENIED]: PROFILE_STATUS.DENIED,
  [TRACKING_QUERY_ERROR.PARTICIPANT_NOT_FOUND]: PROFILE_STATUS.NOT_FOUND,
  [TRACKING_QUERY_ERROR.COHORT_NOT_FOUND]: PROFILE_STATUS.COHORT_NOT_FOUND,
  [TRACKING_QUERY_ERROR.OUTSIDE_COHORT]: PROFILE_STATUS.OUTSIDE_COHORT,
  [TRACKING_QUERY_ERROR.MODULE_UNAVAILABLE]: PROFILE_STATUS.UNAVAILABLE,
});

const STATUS_BY_OUTCOME = Object.freeze({
  [PROFILE_OUTCOME.OK]: PROFILE_STATUS.READY,
  [PROFILE_OUTCOME.NO_PROFILE]: PROFILE_STATUS.NO_PROFILE,
  [PROFILE_OUTCOME.DENIED]: PROFILE_STATUS.DENIED,
  [PROFILE_OUTCOME.INCONSISTENT]: PROFILE_STATUS.INCONSISTENT,
});

/*
 * Ficha individual de seguimiento (RF-128), solo consulta. Muestra datos
 * solo si la fuente autoriza explícitamente y la respuesta corresponde a
 * la cohorte y la referencia pedidas (services/trackingProfileResponse).
 * Los estados se deciden por código, nunca por texto; un fallo o una
 * denegación no dejan datos visibles ni se sustituyen por ficticios.
 * Al abrir la ficha el foco va a su título.
 */
export function useParticipantTrackingProfile({ cohortId, reference, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending = mode === TRACKING_SOURCE_MODE.PENDING_INTEGRATION;

  const [cohort, setCohort] = useState(null);
  const [code, setCode] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Datos de la cohorte para el encabezado (no son datos del participante).
  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    source.getCohort(cohortId).then(
      (value) => { if (active) setCohort(value ?? null); },
      () => { if (active) setCohort(null); },
    );

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isIntegrationPending, source]);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    async function load() {
      setIsLoading(true);
      setStatus(null);

      try {
        const result = interpretProfileResponse(await source.getProfile(cohortId, reference), { cohortId, reference });
        if (!active) return;

        const visible = result.outcome === PROFILE_OUTCOME.OK || result.outcome === PROFILE_OUTCOME.NO_PROFILE;
        setCode(visible ? result.code : null);
        setProfile(result.outcome === PROFILE_OUTCOME.OK ? result.profile : null);
        setStatus(STATUS_BY_OUTCOME[result.outcome]);
      } catch (error) {
        if (!active) return;

        setCode(null);
        setProfile(null);
        setStatus(STATUS_BY_CODE[error?.code] ?? PROFILE_STATUS.ERROR);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, isIntegrationPending, reference, source]);

  return {
    cohort,
    code,
    profile,
    status,
    isLoading,
    isDemo: mode === TRACKING_SOURCE_MODE.DEMO,
    isIntegrationPending,
    headingRef,
    retry: () => setAttempt((value) => value + 1),
  };
}
