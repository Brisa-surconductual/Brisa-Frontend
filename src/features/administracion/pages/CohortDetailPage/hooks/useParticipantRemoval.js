import { useEffect, useRef, useState } from 'react';

import { removeCohortParticipant } from '../../../data/participantSource.js';
import { REMOVAL_ERROR } from '../../../types/participantRemoval.js';
import {
  REMOVAL_STORAGE_ERROR,
  getRemovalErrorMessage,
} from '../../../utils/participantRemovalMessages.js';

// Fuente actual; estable entre renders.
const DEFAULT_SOURCE = Object.freeze({ remove: removeCohortParticipant });

// La lista mostrada ya no coincide con la fuente: hay que volver a consultarla.
const STALE_ERRORS = Object.freeze([
  REMOVAL_ERROR.COHORT_NOT_FOUND,
  REMOVAL_ERROR.PARTICIPANT_NOT_FOUND,
  REMOVAL_ERROR.NOT_ASSOCIATED,
]);

const NO_CODE = 'sin código disponible';

/*
 * Retiro de participantes de una cohorte (RF-125). Exige confirmación;
 * al confirmar el diálogo se cierra y la tarjeta muestra el proceso
 * (como en E4). La validez la decide la fuente al aplicar el retiro:
 * aquí no se repite. Un participante en proceso no admite otro retiro
 * hasta terminar. Si la fuente informa datos desactualizados se vuelve
 * a consultar la lista con `onStale`; nunca se modifica a ciegas.
 * `enabled` es false sin una fuente que admita retirar.
 */
export function useParticipantRemoval({
  cohortId,
  cohortName = '',
  enabled = false,
  onRemoved = () => {},
  onStale = () => {},
  source = DEFAULT_SOURCE,
} = {}) {
  const [busyIds, setBusyIds] = useState([]);
  const [notice, setNotice] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const inFlight = useRef(new Set());
  const noticeRef = useRef(null);

  // El resultado recibe el foco: la tarjeta retirada desaparece.
  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  async function apply(participant) {
    if (!enabled || inFlight.current.has(participant.id)) return;

    const code = participant.code?.trim() || NO_CODE;

    inFlight.current.add(participant.id);
    setBusyIds((current) => [...current, participant.id]);
    setNotice(null);

    try {
      const result = await source.remove(cohortId, participant.id);

      if (result?.ok) {
        onRemoved(participant.id);
        setNotice({
          tone: 'success',
          title: 'Participante retirado temporalmente',
          message: `«${code}» ya no forma parte de «${cohortName}». Los cambios son temporales y no se guardan en el servidor.`,
        });
      } else {
        if (STALE_ERRORS.includes(result?.error)) onStale();
        setNotice({ tone: 'warning', title: 'No se retiró al participante', message: getRemovalErrorMessage(result?.error) });
      }
    } catch {
      setNotice({ tone: 'danger', title: 'No se retiró al participante', message: REMOVAL_STORAGE_ERROR });
    } finally {
      inFlight.current.delete(participant.id);
      setBusyIds((current) => current.filter((id) => id !== participant.id));
    }
  }

  return {
    canRemove: enabled,
    busyIds,
    notice,
    noticeRef,
    pendingRemoval,
    requestRemoval: (participant) => {
      if (enabled) setPendingRemoval(participant);
    },
    // Cancelar (o Escape) no envía nada.
    cancelRemoval: () => setPendingRemoval(null),
    // Otra operación posterior (una asignación) deja el aviso obsoleto.
    dismissNotice: () => setNotice(null),
    confirmRemoval: () => {
      const participant = pendingRemoval;
      setPendingRemoval(null);
      if (participant) return apply(participant);
      return undefined;
    },
  };
}
