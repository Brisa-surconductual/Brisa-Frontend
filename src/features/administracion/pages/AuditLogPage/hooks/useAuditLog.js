import { useEffect, useState } from 'react';

import { getAuditSourceMode, listAuditRecords } from '../../../data/auditSource.js';
import { toAuditEntries } from '../../../services/auditEntry.js';
import { AUDIT_QUERY_ERROR, AUDIT_SOURCE_MODE } from '../../../types/auditSource.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  getMode: getAuditSourceMode,
  list: listAuditRecords,
});

export const AUDIT_LOG_ERROR_MESSAGE =
  'No pudimos cargar los registros de auditoría. Intenta nuevamente.';

/*
 * Consulta de la bitácora de auditoría (RF-123), de solo lectura.
 * Presenta los registros en el orden recibido, ya reducidos a los
 * campos permitidos (services/auditEntry.js). Distingue carga, error,
 * acceso denegado (por código estructurado, no por texto), lista vacía
 * e integración pendiente; un fallo nunca se reemplaza por registros
 * ficticios. `source` permite sustituir la fuente sin cambiar la página.
 */
export function useAuditLog({ source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const isIntegrationPending = mode === AUDIT_SOURCE_MODE.PENDING_INTEGRATION;

  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(!isIntegrationPending);
  const [loadError, setLoadError] = useState('');
  const [isDenied, setIsDenied] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isIntegrationPending) return undefined;

    let active = true;

    async function fetchRecords() {
      setIsLoading(true);
      setLoadError('');
      setIsDenied(false);

      try {
        const records = await source.list();
        if (active) setEntries(toAuditEntries(records));
      } catch (error) {
        if (!active) return;

        setEntries([]);
        if (error?.code === AUDIT_QUERY_ERROR.ACCESS_DENIED) setIsDenied(true);
        else setLoadError(AUDIT_LOG_ERROR_MESSAGE);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchRecords();

    return () => {
      active = false;
    };
  }, [attempt, isIntegrationPending, source]);

  return {
    entries,
    isLoading,
    loadError,
    isDenied,
    isDemo: mode === AUDIT_SOURCE_MODE.DEMO,
    isIntegrationPending,
    retry: () => setAttempt((value) => value + 1),
  };
}
