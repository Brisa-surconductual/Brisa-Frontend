import { useEffect, useState } from 'react';

import { getAuditSourceMode, listAuditRecords } from '../../../data/auditSource.js';
import { toAuditEntries } from '../../../services/auditEntry.js';
import { AUDIT_QUERY_ERROR, AUDIT_SOURCE_MODE } from '../../../types/auditSource.js';

const DEFAULT_SOURCE = Object.freeze({
  getMode: getAuditSourceMode,
  list: listAuditRecords,
});

export const AUDIT_LOG_ERROR_MESSAGE =
  'No pudimos cargar los registros de auditoría. Intenta nuevamente.';

export function useAuditLog({ source = DEFAULT_SOURCE } = {}) {
  const [mode] = useState(() => source.getMode());
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isDenied, setIsDenied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRecords() {
      setIsLoading(true);
      setLoadError('');
      setIsDenied(false);
      setIsSessionExpired(false);

      try {
        const page = await source.list({ cursor, signal: controller.signal });
        if (controller.signal.aborted) return;

        const records = toAuditEntries(page.records);
        if (cursor === null) setEntries(records);
        else setEntries((previous) => [...previous, ...records]);

        setNextCursor(page.nextCursor);
      } catch (error) {
        if (controller.signal.aborted) return;

        const denied = error?.code === AUDIT_QUERY_ERROR.ACCESS_DENIED;
        const expired = error?.code === AUDIT_QUERY_ERROR.SESSION_EXPIRED;
        if (cursor === null || denied || expired) setEntries([]);
        if (denied) setIsDenied(true);
        else if (expired) setIsSessionExpired(true);
        else setLoadError(AUDIT_LOG_ERROR_MESSAGE);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void fetchRecords();

    return () => controller.abort();
  }, [attempt, cursor, source]);

  return {
    entries,
    isLoading: isLoading && cursor === null,
    isLoadingMore: isLoading && cursor !== null,
    loadError,
    isDenied,
    isDemo: mode === AUDIT_SOURCE_MODE.DEMO,
    isSessionExpired,
    hasMore: nextCursor !== null,
    retry: () => setAttempt((value) => value + 1),
    loadMore: () => {
      if (nextCursor && !isLoading && !loadError && !isDenied && !isSessionExpired) {
        setCursor(nextCursor);
      }
    },
  };
}
