import {
  AlertTriangle,
  ClockAlert,
  CloudOff,
  Inbox,
  KeyRound,
  RefreshCw,
  SearchX,
  ShieldAlert,
  ShieldX,
  UserX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { SECTION_STATUS } from '../../types/participantEngagement.js';
import { CohortNotice } from '../CohortNotice/index.js';

/*
 * Carga y avisos de una sección independiente de la ficha (RF-130,
 * RF-131). Cada sección aporta sus textos (`messages`, por estado); los
 * comunes se completan aquí. Un acceso restringido se distingue con
 * ícono y título propios, nunca solo con color. Solo «Reintentar» en los
 * estados que pueden resolverse reintentando.
 */
const RETRY_STATUSES = Object.freeze([
  SECTION_STATUS.UNAVAILABLE,
  SECTION_STATUS.ERROR,
  SECTION_STATUS.INCONSISTENT,
  SECTION_STATUS.STALE_UNDATED,
]);

const PRESENTATION = Object.freeze({
  [SECTION_STATUS.EMPTY]: Object.freeze({ tone: 'neutral', icon: Inbox, role: 'status' }),
  [SECTION_STATUS.DENIED]: Object.freeze({ tone: 'warning', icon: ShieldX, role: 'alert' }),
  [SECTION_STATUS.PERMISSION_REQUIRED]: Object.freeze({ tone: 'warning', icon: KeyRound, role: 'alert' }),
  [SECTION_STATUS.NOT_FOUND]: Object.freeze({ tone: 'neutral', icon: SearchX, role: 'alert' }),
  [SECTION_STATUS.COHORT_NOT_FOUND]: Object.freeze({ tone: 'neutral', icon: SearchX, role: 'alert' }),
  [SECTION_STATUS.OUTSIDE_COHORT]: Object.freeze({ tone: 'neutral', icon: UserX, role: 'alert' }),
  [SECTION_STATUS.INCONSISTENT]: Object.freeze({ tone: 'danger', icon: ShieldAlert, role: 'alert' }),
  [SECTION_STATUS.UNAVAILABLE]: Object.freeze({ tone: 'warning', icon: CloudOff, role: 'alert' }),
  [SECTION_STATUS.STALE_UNDATED]: Object.freeze({ tone: 'warning', icon: ClockAlert, role: 'alert' }),
  [SECTION_STATUS.ERROR]: Object.freeze({ tone: 'danger', icon: AlertTriangle, role: 'alert' }),
});

const COMMON_MESSAGES = Object.freeze({
  [SECTION_STATUS.NOT_FOUND]: Object.freeze({ title: 'Participante no encontrado', message: 'El participante seleccionado no existe.' }),
  [SECTION_STATUS.COHORT_NOT_FOUND]: Object.freeze({ title: 'Cohorte no encontrada', message: 'La cohorte solicitada no existe en el sistema.' }),
  [SECTION_STATUS.OUTSIDE_COHORT]: Object.freeze({
    title: 'Participante fuera de la cohorte',
    message: 'El participante ya no pertenece a esta cohorte. Esta información no se muestra aquí.',
  }),
});

const SIMULATED = ' Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.';

export function ProfileSectionStatus({ status, isLoading, messages, loadingLabel, retryLabel, retry, isDemo }) {
  if (isLoading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-[var(--space-3)]">
        <p role="status" className="sr-only">
          {loadingLabel}
        </p>
        <div
          aria-hidden="true"
          className="h-[96px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
        />
      </div>
    );
  }

  const presentation = PRESENTATION[status];
  const text = messages[status] ?? COMMON_MESSAGES[status];

  if (!presentation || !text) return null;

  const restricted = status === SECTION_STATUS.DENIED || status === SECTION_STATUS.PERMISSION_REQUIRED;

  return (
    <CohortNotice
      tone={presentation.tone}
      icon={presentation.icon}
      title={text.title}
      role={presentation.role}
      action={
        RETRY_STATUSES.includes(status) ? (
          <Button variant="secondary" onClick={retry}>
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : null
      }
    >
      {text.message}
      {restricted && isDemo && SIMULATED}
    </CohortNotice>
  );
}
