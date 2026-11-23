import { Link } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';

import { getParticipantSessionsPath } from '../../utils/chatTraceabilityRoutes.js';

/*
 * Acceso desde la ficha de M08 a las sesiones del chat del participante
 * (RF-38). Solo se ofrece con un código A7 AUTÉNTICO: `authentic` lo
 * decide quien lo monta (una fuente real autorizada, nunca la
 * demostración) y el código debe tener el formato A7. La referencia
 * opaca de la ficha (`seg-…`) nunca se usa ni se convierte en código.
 */
export function ParticipantSessionsLink({ participantCode, authentic = false, returnTo = null }) {
  const path = authentic ? getParticipantSessionsPath(participantCode) : null;

  if (!path) return null;

  return (
    <Link
      to={path}
      state={returnTo ? { from: returnTo } : null}
      className="inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-[1.5px] border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)] no-underline transition-colors duration-150 hover:border-[var(--button-secondary-hover-border)] hover:bg-[var(--button-secondary-hover-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] motion-reduce:transition-none"
    >
      <MessagesSquare size={18} strokeWidth={1.8} aria-hidden="true" />
      Sesiones del chat
    </Link>
  );
}
