import { RefreshCw } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { TRACE_NOTICE, traceNoticeText } from '../../utils/chatTraceabilityMessages.js';
import { CohortNotice } from '../CohortNotice/index.js';

/*
 * Aviso de un estado sin datos de la trazabilidad (RF-38). «Reintentar»
 * solo aparece si el error lo permite y siempre es una acción del
 * usuario: no hay reintentos automáticos.
 */
export function TraceQueryNotice({ error, onRetry }) {
  const notice = error ? TRACE_NOTICE[error.status] : null;

  if (!notice) return null;

  return (
    <CohortNotice
      tone={notice.tone}
      icon={notice.icon}
      title={notice.title}
      role="alert"
      action={
        error.canRetry && onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            Reintentar
          </Button>
        ) : null
      }
    >
      {traceNoticeText(error.status, error.message)}
    </CohortNotice>
  );
}
