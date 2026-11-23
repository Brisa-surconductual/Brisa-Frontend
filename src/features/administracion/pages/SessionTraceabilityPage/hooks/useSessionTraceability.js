import { useEffect, useRef, useState } from 'react';

import { fetchSessionTraceability } from '../../../api/chatTraceability/fetchSessionTraceability.js';
import { classifyTraceError } from '../../../services/chatTraceabilityError.js';
import {
  normalizeParticipantCode,
  normalizeSessionId,
} from '../../../services/chatTraceabilityIds.js';
import { interpretSessionTrace } from '../../../services/sessionTraceResponse.js';
import { TRACE_QUERY_STATUS } from '../../../types/chatTraceability.js';

// Fuente real (HTTP); las pruebas inyectan otra con la misma firma.
const DEFAULT_SOURCE = Object.freeze({ fetchTrace: fetchSessionTraceability });

const initialState = (valid) =>
  Object.freeze({
    status: valid ? TRACE_QUERY_STATUS.LOADING : TRACE_QUERY_STATUS.INVALID_ROUTE,
    trace: null,
    error: null,
  });

/*
 * Trazabilidad de una sesión de un participante (RF-38), solo lectura.
 * - Exige el código A7 y el UUID de la sesión; con cualquiera inválido
 *   no se consulta nada.
 * - Envía siempre `codigo_participante`: el backend comprueba que la
 *   sesión sea de ese participante.
 * - La respuesta debe corresponder a la sesión y al participante pedidos
 *   (services/sessionTraceResponse.js); si no, no se muestra nada.
 * - Al desmontarse (la página se vuelve a montar por cada sesión) se
 *   cancela la petición y se ignora una respuesta tardía.
 * - Un 422, un 500 o una respuesta inválida no dejan registros parciales.
 */
export function useSessionTraceability({
  participantCode,
  sessionId,
  source = DEFAULT_SOURCE,
} = {}) {
  const code = normalizeParticipantCode(participantCode);
  const id = normalizeSessionId(sessionId);
  const valid = Boolean(code && id);
  const [state, setState] = useState(() => initialState(valid));
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!valid) return undefined;

    const controller = new AbortController();

    async function load() {
      setState(initialState(true));

      try {
        const data = await source.fetchTrace(id, code, { signal: controller.signal });
        if (controller.signal.aborted) return;

        const result = interpretSessionTrace(data, { sessionId: id, code });
        setState(
          result.ok
            ? { status: TRACE_QUERY_STATUS.READY, trace: result.trace, error: null }
            : {
                status: result.status,
                trace: null,
                error: Object.freeze({ status: result.status, message: '', canRetry: true }),
              },
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        const failure = classifyTraceError(error);
        setState({ status: failure.status, trace: null, error: failure });
      }
    }

    void load();

    return () => controller.abort();
  }, [attempt, code, id, source, valid]);

  return {
    code,
    sessionId: id,
    ...state,
    headingRef,
    retry: () => setAttempt((value) => value + 1),
  };
}
