import { useEffect, useState } from 'react';

import { sectionStatusFromError, sectionStatusFromOutcome } from '../../../services/profileSectionResponse.js';
import { SECTION_OUTCOME, SECTION_STATUS } from '../../../types/participantEngagement.js';

/*
 * Consulta de una sección independiente de la ficha (RF-130, RF-131).
 *
 * `enabled` lo decide la ficha: solo se consulta cuando la ficha ya
 * confirmó el acceso al participante. Sin habilitar no se consulta y no
 * se expone ningún dato, aunque quede un resultado anterior. Cada
 * sección tiene su propio estado y su propio error: un fallo no oculta
 * las demás. Los estados se deciden por resultado o código, nunca por
 * el texto del error.
 *
 * `query(cohortId, reference)` consulta la fuente; `interpret(response,
 * { cohortId, reference })` aplica autorización, aislamiento y lista de
 * campos, y devuelve { outcome, data }.
 */
export function useProfileSectionQuery({ cohortId, reference, enabled, query, interpret }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;

    async function load() {
      setIsLoading(true);
      setStatus(null);
      setData(null);

      try {
        const result = interpret(await query(cohortId, reference), { cohortId, reference });
        if (!active) return;

        setData(result.outcome === SECTION_OUTCOME.OK ? result.data : null);
        setStatus(sectionStatusFromOutcome(result.outcome));
      } catch (error) {
        if (!active) return;

        setData(null);
        setStatus(sectionStatusFromError(error));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, cohortId, enabled, interpret, query, reference]);

  return {
    data: enabled && status === SECTION_STATUS.READY ? data : null,
    status: enabled ? status : null,
    isLoading: Boolean(enabled) && (isLoading || status === null),
    retry: () => setAttempt((value) => value + 1),
  };
}
