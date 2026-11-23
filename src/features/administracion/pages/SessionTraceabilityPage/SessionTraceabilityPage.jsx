import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, FileQuestion, FileWarning, ListOrdered } from 'lucide-react';

import { CohortNotice } from '../../components/CohortNotice/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { TraceQueryNotice } from '../../components/TraceQueryNotice/index.js';
import { TraceabilityTimeline } from '../../components/TraceabilityTimeline/index.js';
import { TRACE_QUERY_STATUS } from '../../types/chatTraceability.js';
import {
  getParticipantSessionsPath,
  safeAdminReturnPath,
} from '../../utils/chatTraceabilityRoutes.js';
import { COHORTS_PATH } from '../../utils/cohortRoutes.js';

import { useSessionTraceability } from './hooks/useSessionTraceability.js';

/*
 * Trazabilidad de una sesión conversacional
 * (/app/administrativo/chat/participantes/:codigoParticipante/sesiones/
 * :idSesion/trazabilidad, RF-38). Línea de tiempo de solo lectura con el
 * contenido histórico (solo si el backend lo verificó), la respuesta
 * registrada sin modificar y el fin del flujo. La página solo compone; el
 * estado vive en el hook. Se monta de nuevo por cada sesión.
 */
const LOGIN_PATH = '/login';

export function SessionTraceabilityPage() {
  const { codigoParticipante, idSesion } = useParams();
  const code = codigoParticipante ?? null;
  const sessionId = idSesion ?? null;

  return <SessionTraceability key={`${code}|${sessionId}`} participantCode={code} sessionId={sessionId} />;
}

function SessionTraceability({ participantCode, sessionId }) {
  const location = useLocation();
  const returnTo = safeAdminReturnPath(location.state?.from);
  const { code, status, trace, error, headingRef, retry } = useSessionTraceability({
    participantCode,
    sessionId,
  });

  if (status === TRACE_QUERY_STATUS.UNAUTHENTICATED) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const sessionsPath = getParticipantSessionsPath(code);
  const isLoading = status === TRACE_QUERY_STATUS.LOADING;
  const records = status === TRACE_QUERY_STATUS.READY && trace ? trace.records : null;

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={sessionsPath ?? COHORTS_PATH}
        state={sessionsPath && returnTo ? { from: returnTo } : null}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        {sessionsPath ? 'Volver a las sesiones' : 'Volver a cohortes'}
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
          Trazabilidad de la sesión
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
          Secuencia de contenidos y respuestas registradas, en orden. El texto
          de cada contenido solo se muestra cuando el sistema puede confirmar
          que es el que vio el participante.
        </p>
      </header>

      <ReadOnlyNotice>
        Consulta de solo lectura: las respuestas registradas no pueden
        modificarse, eliminarse, reenviarse ni descargarse desde aquí.
      </ReadOnlyNotice>

      {status === TRACE_QUERY_STATUS.INVALID_ROUTE && (
        <CohortNotice tone="warning" icon={FileWarning} title="Enlace no válido" role="alert">
          La dirección no tiene un código de participante (P- seguido de 8
          caracteres hexadecimales) o un identificador de sesión válidos. No
          se realizó ninguna consulta.
        </CohortNotice>
      )}

      {isLoading && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando la trazabilidad de la sesión...
          </p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-[180px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
            />
          ))}
        </div>
      )}

      <TraceQueryNotice error={error} onRetry={retry} />

      {records && records.length === 0 && (
        <CohortNotice tone="neutral" icon={FileQuestion} title="Sin interacciones" role="status">
          La sesión no tiene interacciones registradas.
        </CohortNotice>
      )}

      {records && records.length > 0 && (
        <section aria-labelledby="interacciones-sesion" className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-1)]">
            <h2 id="interacciones-sesion" className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
              <ListOrdered size={20} strokeWidth={1.8} aria-hidden="true" />
              Interacciones ({records.length})
            </h2>
            <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-muted)] [overflow-wrap:anywhere]">
              Sesión{' '}
              <span className="font-[family-name:var(--font-mono)]">{trace.sessionId}</span>
            </p>
          </div>

          <TraceabilityTimeline records={records} />
        </section>
      )}
    </div>
  );
}
