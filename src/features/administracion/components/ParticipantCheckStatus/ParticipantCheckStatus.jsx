import { CircleCheck, CircleDashed, CircleHelp, CircleX } from 'lucide-react';

import {
  BASELINE_STATUS,
  CONSENT_STATUS,
  REGISTRATION_STATUS,
} from '../../types/participantStatus.js';

import { PARTICIPANT_CHECK } from './participantCheck.js';

/*
 * Estado de registro, consentimiento o línea base de un participante
 * (RF-125), tal como lo informa la fuente: no se deduce ni se corrige.
 * Ícono y texto acompañan siempre al color. Un valor desconocido se
 * muestra tal cual y uno ausente como «Sin información».
 */
const TONE = Object.freeze({
  done: Object.freeze({ Icon: CircleCheck, className: 'text-[var(--success-text)]' }),
  missing: Object.freeze({ Icon: CircleX, className: 'text-[var(--danger-text)]' }),
  pending: Object.freeze({ Icon: CircleDashed, className: 'text-[var(--warning-text)]' }),
  unknown: Object.freeze({ Icon: CircleHelp, className: 'text-[var(--text-muted)]' }),
});

const PRESENTATION = Object.freeze({
  [PARTICIPANT_CHECK.REGISTRATION]: Object.freeze({
    [REGISTRATION_STATUS.COMPLETE]: Object.freeze({ label: 'Completo', tone: 'done' }),
    [REGISTRATION_STATUS.INCOMPLETE]: Object.freeze({ label: 'Incompleto', tone: 'missing' }),
    [REGISTRATION_STATUS.PENDING]: Object.freeze({ label: 'Pendiente', tone: 'pending' }),
  }),
  [PARTICIPANT_CHECK.CONSENT]: Object.freeze({
    [CONSENT_STATUS.ACCEPTED]: Object.freeze({ label: 'Aceptado', tone: 'done' }),
    [CONSENT_STATUS.NOT_ACCEPTED]: Object.freeze({ label: 'No aceptado', tone: 'missing' }),
    [CONSENT_STATUS.PENDING]: Object.freeze({ label: 'Pendiente', tone: 'pending' }),
  }),
  [PARTICIPANT_CHECK.BASELINE]: Object.freeze({
    [BASELINE_STATUS.REGISTERED]: Object.freeze({ label: 'Registrada', tone: 'done' }),
    [BASELINE_STATUS.NOT_REGISTERED]: Object.freeze({ label: 'No registrada', tone: 'missing' }),
    [BASELINE_STATUS.PENDING]: Object.freeze({ label: 'Pendiente', tone: 'pending' }),
  }),
});

export function ParticipantCheckStatus({ check, value }) {
  const presentation = PRESENTATION[check]?.[value];
  const { Icon, className } = TONE[presentation?.tone ?? 'unknown'];

  return (
    <span className="inline-flex items-center gap-[var(--space-1)] font-semibold text-[var(--text-primary)]">
      <Icon size={16} strokeWidth={1.8} className={`shrink-0 ${className}`} aria-hidden="true" />
      {presentation?.label ?? (value || 'Sin información')}
    </span>
  );
}
