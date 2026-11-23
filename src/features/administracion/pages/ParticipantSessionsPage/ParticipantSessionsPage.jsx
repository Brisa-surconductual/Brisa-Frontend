import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, FileQuestion, FileWarning, MessagesSquare } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ChatSessionCard } from '../../components/ChatSessionCard/index.js';
import { CohortNotice } from '../../components/CohortNotice/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { TraceQueryNotice } from '../../components/TraceQueryNotice/index.js';
import { TRACE_QUERY_STATUS } from '../../types/chatTraceability.js';
import {
  getSessionTraceabilityPath,
  safeAdminReturnPath,
} from '../../utils/chatTraceabilityRoutes.js';
import { COHORTS_PATH } from '../../utils/cohortRoutes.js';

import { useParticipantSessions } from './hooks/useParticipantSessions.js';

/*
 * Sesiones conversacionales de un participante
 * (/app/administrativo/chat/participantes/:codigoParticipante/sesiones,
 * RF-38). Solo consulta, por el seudónimo A7: nunca por correo, nombre ni
 * UUID del estudiante. Muestra lo que entrega el endpoint (modalidad,
 * estado y fechas), incluidas las sesiones SOS, y enlaza a la
 * trazabilidad de cada una. La página solo compone; el estado vive en
 * el hook. Se monta de nuevo por cada participante para que ningún dato
 * de otro quede visible.
 */
const LOGIN_PATH = '/login';

export function ParticipantSessionsPage() {
  const { codigoParticipante } = useParams();
  const code = codigoParticipante ?? null;

  return <ParticipantSessions key={code ?? ''} participantCode={code} />;
}

function ParticipantSessions({ participantCode }) {
  const location = useLocation();
  const returnTo = safeAdminReturnPath(location.state?.from);
  const {
    code, status, page, error, isLoadingMore, loadMoreError, headingRef, loadMore, retry,
  } = useParticipantSessions({ participantCode });

  // 401: se respeta la autenticación existente, como en el chat.
  if (status === TRACE_QUERY_STATUS.UNAUTHENTICATED) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const isLoading = status === TRACE_QUERY_STATUS.LOADING;
  const ready = status === TRACE_QUERY_STATUS.READY && page;
  const sessions = ready ? page.sessions : [];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={returnTo ?? COHORTS_PATH}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        {returnTo ? 'Volver' : 'Volver a cohortes'}
      </Link>

      <header className="flex flex-col gap-[var(--space-2)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración · Chat · Trazabilidad
        </p>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]"
        >
          Sesiones del chat
          {code && (
            <>
              <span className="sr-only"> del participante</span>
              <span className="block font-[family-name:var(--font-mono)] text-[length:var(--font-size-xl)] text-[var(--text-secondary)] md:text-[length:var(--font-size-2xl)]">
                {code}
              </span>
            </>
          )}
        </h1>

        <p className="m-0 max-w-[680px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Sesiones conversacionales del participante, de la más reciente a la más antigua.
          Selecciona una para ver su trazabilidad completa.
        </p>
      </header>

      <ReadOnlyNotice>
        Consulta de solo lectura: las sesiones y sus respuestas provienen del
        chat y no pueden modificarse, eliminarse, reenviarse ni descargarse
        desde aquí. Solo se muestra el código seudonimizado del participante.
      </ReadOnlyNotice>

      {status === TRACE_QUERY_STATUS.INVALID_ROUTE && (
        <CohortNotice tone="warning" icon={FileWarning} title="Código de participante no válido" role="alert">
          El código debe tener el formato P- seguido de 8 caracteres
          hexadecimales (por ejemplo, P-1A2B3C4D). No se realizó ninguna consulta.
        </CohortNotice>
      )}

      {isLoading && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando las sesiones del participante...
          </p>
          <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-[220px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      )}

      <TraceQueryNotice error={error} onRetry={retry} />

      {ready && sessions.length === 0 && (
        <CohortNotice tone="neutral" icon={FileQuestion} title="Sin sesiones" role="status">
          El participante no tiene sesiones conversacionales registradas.
        </CohortNotice>
      )}

      {ready && sessions.length > 0 && (
        <section aria-labelledby="sesiones-participante" className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)]">
            <h2 id="sesiones-participante" className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
              <MessagesSquare size={20} strokeWidth={1.8} aria-hidden="true" />
              Sesiones
            </h2>
            <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]" aria-live="polite">
              Mostrando {sessions.length} de {page.total}{' '}
              {page.total === 1 ? 'sesión' : 'sesiones'}
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <li key={session.id}>
                <ChatSessionCard
                  session={session}
                  tracePath={getSessionTraceabilityPath(code, session.id)}
                  linkState={returnTo ? { from: returnTo } : null}
                />
              </li>
            ))}
          </ul>

          {loadMoreError && <TraceQueryNotice error={loadMoreError} onRetry={loadMore} />}

          {page.nextCursor && !loadMoreError && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={loadMore}
              loading={isLoadingMore}
              loadingText="Cargando sesiones..."
            >
              Cargar más sesiones
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
