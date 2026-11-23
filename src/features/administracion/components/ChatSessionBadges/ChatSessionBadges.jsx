import {
  CircleAlert,
  CircleCheck,
  CirclePause,
  CirclePlay,
  LifeBuoy,
  UserRound,
  Users,
} from 'lucide-react';

import {
  SESSION_MODALITY,
  SESSION_MODALITY_LABEL,
  SESSION_STATE,
  SESSION_STATE_LABEL,
} from '../../types/chatTraceability.js';

/*
 * Estado y modalidad de una sesión conversacional (RF-38). Ícono y texto
 * acompañan siempre al color. Un valor desconocido se muestra tal cual,
 * sin inventar estados ni modalidades.
 */
const BASE_CLASS =
  'inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold';

const NEUTRAL_CLASS =
  'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';

const STATE_PRESENTATION = Object.freeze({
  [SESSION_STATE.ACTIVA]: Object.freeze({
    Icon: CirclePlay,
    className: 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
  }),
  [SESSION_STATE.PAUSADA]: Object.freeze({
    Icon: CirclePause,
    className: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
  [SESSION_STATE.COMPLETADA]: Object.freeze({
    Icon: CircleCheck,
    className: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  [SESSION_STATE.ERROR_CONFIGURACION]: Object.freeze({
    Icon: CircleAlert,
    className: 'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
  }),
});

const MODALITY_PRESENTATION = Object.freeze({
  [SESSION_MODALITY.GRUPAL]: Object.freeze({ Icon: Users, className: NEUTRAL_CLASS }),
  [SESSION_MODALITY.PERSONALIZADA]: Object.freeze({ Icon: UserRound, className: NEUTRAL_CLASS }),
  [SESSION_MODALITY.SOS]: Object.freeze({
    Icon: LifeBuoy,
    className: 'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]',
  }),
});

export function SessionStateBadge({ state }) {
  const presentation = STATE_PRESENTATION[state];
  const Icon = presentation?.Icon;

  return (
    <span className={`${BASE_CLASS} ${presentation?.className ?? NEUTRAL_CLASS}`}>
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
      <span className="sr-only">Estado: </span>
      {SESSION_STATE_LABEL[state] ?? state}
    </span>
  );
}

export function SessionModalityBadge({ modality }) {
  const presentation = MODALITY_PRESENTATION[modality];
  const Icon = presentation?.Icon;

  return (
    <span className={`${BASE_CLASS} ${presentation?.className ?? NEUTRAL_CLASS}`}>
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
      <span className="sr-only">Modalidad: </span>
      {SESSION_MODALITY_LABEL[modality] ?? modality}
    </span>
  );
}
