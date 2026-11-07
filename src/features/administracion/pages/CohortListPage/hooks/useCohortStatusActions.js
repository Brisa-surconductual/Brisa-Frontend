import { useEffect, useRef, useState } from 'react';

import { changeCohortStatus } from '../../../data/cohortSource.js';
import { COHORT_TRANSITION } from '../../../services/cohortTransitions.js';

const DEFAULT_SOURCE = Object.freeze({ changeStatus: changeCohortStatus });

// Sin «guardada»: en la demostración nada llega al servidor.
const SUCCESS = Object.freeze({
  [COHORT_TRANSITION.ACTIVATE]: Object.freeze({ title: 'Cohorte activada temporalmente', state: 'activa' }),
  [COHORT_TRANSITION.INACTIVATE]: Object.freeze({ title: 'Cohorte inactivada temporalmente', state: 'inactiva' }),
});

const FAILURE_TITLE = Object.freeze({
  [COHORT_TRANSITION.ACTIVATE]: 'No se pudo activar la cohorte',
  [COHORT_TRANSITION.INACTIVATE]: 'No se pudo inactivar la cohorte',
});

export const STATUS_CHANGE_ERROR =
  'Ocurrió un error y la cohorte conserva su estado anterior. Intenta nuevamente.';
export const STATUS_CHANGE_NOT_FOUND_MESSAGE =
  'La cohorte ya no existe. Vuelve a cargar el listado.';

/*
 * Activar (BORRADOR → ACTIVA) e inactivar (ACTIVA → INACTIVA) cohortes
 * (RF-124). La validez la decide la fuente al aplicar el cambio, con
 * las reglas puras de services/cohortTransitions.js: aquí no se
 * repiten. Inactivar exige confirmación; una cohorte en proceso no
 * admite otra acción hasta terminar.
 */
export function useCohortStatusActions({ onCohortChanged, source = DEFAULT_SOURCE } = {}) {
  const [busyIds, setBusyIds] = useState([]);
  const [notice, setNotice] = useState(null);
  const [pendingInactivation, setPendingInactivation] = useState(null);
  const inFlight = useRef(new Set());
  const noticeRef = useRef(null);

  // El resultado recibe el foco: el botón pulsado puede desaparecer.
  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  async function apply(cohort, transition) {
    if (inFlight.current.has(cohort.id)) return;

    inFlight.current.add(cohort.id);
    setBusyIds((current) => [...current, cohort.id]);
    setNotice(null);

    try {
      const result = await source.changeStatus(cohort.id, transition);

      if (result?.cohort) onCohortChanged?.(result.cohort);

      if (result?.ok) {
        const { title, state } = SUCCESS[transition];
        setNotice({ tone: 'success', title, message: `«${result.cohort.name}» ahora está ${state}.` });
      } else {
        setNotice({
          tone: 'warning',
          title: FAILURE_TITLE[transition],
          message: result?.message ?? STATUS_CHANGE_NOT_FOUND_MESSAGE,
        });
      }
    } catch {
      setNotice({ tone: 'danger', title: FAILURE_TITLE[transition], message: STATUS_CHANGE_ERROR });
    } finally {
      inFlight.current.delete(cohort.id);
      setBusyIds((current) => current.filter((id) => id !== cohort.id));
    }
  }

  return {
    busyIds,
    notice,
    noticeRef,
    pendingInactivation,
    requestActivation: (cohort) => apply(cohort, COHORT_TRANSITION.ACTIVATE),
    requestInactivation: (cohort) => setPendingInactivation(cohort),
    cancelInactivation: () => setPendingInactivation(null),
    confirmInactivation: () => {
      const cohort = pendingInactivation;
      setPendingInactivation(null);
      if (cohort) return apply(cohort, COHORT_TRANSITION.INACTIVATE);
      return undefined;
    },
  };
}
