import { useEffect, useState } from 'react';

import {
  getCohortSourceMode,
  listCohorts,
} from '../../../data/cohortSource.js';
import { countCohortsByStatus } from '../../../services/cohortSummary.js';
import { COHORT_SOURCE_MODE } from '../../../types/cohortSourceMode.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getCohortSourceMode,
  list: listCohorts,
});

export const COHORT_LIST_ERROR_MESSAGE =
  'No pudimos cargar las cohortes. Intenta nuevamente.';

/*
 * Listado de cohortes (RF-124). Distingue carga, error, lista vacía
 * e integración pendiente: una consulta fallida nunca se presenta
 * como "sin cohortes" ni se reemplaza por datos ficticios.
 * `source` permite sustituir la fuente sin cambiar la página.
 */
export function useCohortList({ source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending = mode === COHORT_SOURCE_MODE.PENDING_INTEGRATION;

  const [cohorts, setCohorts] = useState([]);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    async function fetchCohorts() {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await source.list();
        if (active) setCohorts(Array.isArray(data) ? data : []);
      } catch {
        if (active) {
          setCohorts([]);
          setLoadError(COHORT_LIST_ERROR_MESSAGE);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchCohorts();

    return () => {
      active = false;
    };
  }, [attempt, isIntegrationPending, source]);

  return {
    cohorts,
    statusCounts: countCohortsByStatus(cohorts),
    isLoading,
    loadError,
    isDemo: mode === COHORT_SOURCE_MODE.DEMO,
    isIntegrationPending,
    // La API y la demostración autorizan la gestión en sus propios datos.
    canManage: mode !== COHORT_SOURCE_MODE.PENDING_INTEGRATION,
    retry: () => setAttempt((value) => value + 1),
    // Refleja en el listado una cohorte cambiada (p. ej. su estado).
    replaceCohort: (updated) =>
      setCohorts((current) =>
        current.map((cohort) => {
          if (cohort.id !== updated.id) return cohort;
          if (updated.scheduleName || updated.scheduleId !== cohort.scheduleId || !cohort.scheduleName) {
            return updated;
          }
          return { ...updated, scheduleName: cohort.scheduleName };
        }),
      ),
  };
}
