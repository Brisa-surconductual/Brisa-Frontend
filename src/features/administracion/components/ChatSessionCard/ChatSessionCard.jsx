import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight, History } from 'lucide-react';

import { SessionModalityBadge, SessionStateBadge } from '../ChatSessionBadges/index.js';
import { TraceTimestamp } from '../TraceTimestamp/index.js';

/*
 * Una sesión conversacional del listado de un participante (RF-38).
 * Muestra solo lo que entrega el endpoint: modalidad, estado, inicio y
 * última interacción. El UUID es información técnica secundaria. Sin
 * `tracePath` (identificadores inválidos) no se ofrece el enlace.
 */
export function ChatSessionCard({ session, tracePath = null, linkState = null }) {
  return (
    <article className="flex h-full flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <SessionModalityBadge modality={session.modality} />
        <SessionStateBadge state={session.state} />
      </div>

      <dl className="m-0 flex flex-col gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-secondary)]">
            <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" />
            Inicio
          </dt>
          <dd className="m-0 font-bold text-[var(--text-primary)]">
            <TraceTimestamp value={session.startedAt} />
          </dd>
        </div>

        <div className="flex flex-col gap-[var(--space-1)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-secondary)]">
            <History size={16} strokeWidth={1.8} aria-hidden="true" />
            Última interacción
          </dt>
          <dd className="m-0 font-bold text-[var(--text-primary)]">
            <TraceTimestamp value={session.lastInteractionAt} />
          </dd>
        </div>
      </dl>

      <p className="m-0 text-[length:var(--font-size-xs)] text-[var(--text-muted)] [overflow-wrap:anywhere]">
        Identificador técnico:{' '}
        <span className="font-[family-name:var(--font-mono)]">{session.id}</span>
      </p>

      {tracePath && (
        <Link
          to={tracePath}
          state={linkState}
          className="mt-auto inline-flex min-h-[44px] items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] border-[1.5px] border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)] no-underline transition-colors duration-150 hover:border-[var(--button-secondary-hover-border)] hover:bg-[var(--button-secondary-hover-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] motion-reduce:transition-none"
        >
          <span>
            Ver trazabilidad
            <span className="sr-only"> de la sesión {session.id}</span>
          </span>
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}
