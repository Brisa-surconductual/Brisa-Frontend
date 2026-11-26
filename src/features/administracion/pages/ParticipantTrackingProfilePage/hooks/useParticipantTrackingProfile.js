import { useEffect, useRef, useState } from 'react';

import { getCohort } from '../../../data/cohortSource.js';
import { getParticipantTrackingProfile, getTrackingSourceMode } from '../../../data/trackingSource.js';
import { CURRENT_FRESHNESS, freshnessBlockingStatus, interpretFreshness } from '../../../services/dataFreshness.js';
import { PROFILE_STATUS, classifyProfileError } from '../../../services/trackingErrors.js';
import { interpretProfileResponse } from '../../../services/trackingProfileResponse.js';
import { PROFILE_OUTCOME, TRACKING_SOURCE_MODE } from '../../../types/participantTracking.js';

export { PROFILE_STATUS };

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getTrackingSourceMode,
  getCohort,
  getProfile: getParticipantTrackingProfile,
});

const STATUS_BY_OUTCOME = Object.freeze({
  [PROFILE_OUTCOME.OK]: PROFILE_STATUS.READY,
  [PROFILE_OUTCOME.NO_PROFILE]: PROFILE_STATUS.NO_PROFILE,
  [PROFILE_OUTCOME.INCONSISTENT]: PROFILE_STATUS.INCONSISTENT,
  [PROFILE_OUTCOME.INVALID]: PROFILE_STATUS.ERROR,
});

/*
 * Ficha individual de seguimiento (RF-128), solo consulta.
 *
 * - `participantCode` es el código de la ruta. En la API solo se consulta
 *   con un seudónimo A7, después de comprobar que es miembro activo de
 *   la cohorte de la ruta (data/trackingSource.js).
 * - Los datos solo se muestran tras una respuesta 200 que declare el
 *   mismo participante (services/trackingProfileResponse.js). Un 403, un
 *   404, un 409, una respuesta inconsistente o inválida no dejan ningún
 *   dato visible ni se sustituyen por ficticios.
 * - El código confirmado (`code`) solo existe con perfil o sin perfil
 *   (204): es el único que pueden usar las acciones de la ficha.
 * - Cada consulta se cancela al cambiar de participante y su resultado
 *   tardío se descarta. Al abrir la ficha el foco va a su título.
 */
export function useParticipantTrackingProfile({ cohortId, participantCode, source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());

  const [cohort, setCohort] = useState(null);
  const [code, setCode] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  // RF-149: marca de modo degradado de la respuesta mostrada.
  const [freshness, setFreshness] = useState(CURRENT_FRESHNESS);
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Datos de la cohorte para el encabezado (no son datos del participante).
  useEffect(() => {
    let active = true;

    source.getCohort(cohortId).then(
      (value) => { if (active) setCohort(value ?? null); },
      () => { if (active) setCohort(null); },
    );

    return () => {
      active = false;
    };
  }, [attempt, cohortId, source]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setStatus(null);
      setCode(null);
      setProfile(null);
      setFreshness(CURRENT_FRESHNESS);

      try {
        const response = await source.getProfile(cohortId, participantCode, { signal: controller.signal });
        const result = interpretProfileResponse(response, { code: participantCode });
        if (!active) return;

        const visible = result.outcome === PROFILE_OUTCOME.OK || result.outcome === PROFILE_OUTCOME.NO_PROFILE;
        // La marca solo cuenta tras aceptar y aislar la respuesta (RF-149).
        const freshnessOf = visible && response ? interpretFreshness(response) : CURRENT_FRESHNESS;
        const blocked = freshnessBlockingStatus(freshnessOf);

        setCode(visible && !blocked ? result.code : null);
        setProfile(result.outcome === PROFILE_OUTCOME.OK && !blocked ? result.profile : null);
        setFreshness(blocked ? CURRENT_FRESHNESS : freshnessOf);
        setStatus(blocked ?? STATUS_BY_OUTCOME[result.outcome]);
      } catch (error) {
        if (!active) return;

        setCode(null);
        setProfile(null);
        setFreshness(CURRENT_FRESHNESS);
        setStatus(classifyProfileError(error));
      }

      if (active) setIsLoading(false);
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, cohortId, participantCode, source]);

  return {
    cohort,
    code,
    profile,
    status,
    freshness,
    isLoading,
    isDemo: mode === TRACKING_SOURCE_MODE.DEMO,
    headingRef,
    retry: () => setAttempt((value) => value + 1),
  };
}
