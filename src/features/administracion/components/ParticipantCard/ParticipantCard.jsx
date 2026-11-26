import { CircleAlert, UserMinus } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { PARTICIPATION_STATUS } from '../../types/participantStatus.js';
import {
  PARTICIPANT_CHECK,
  ParticipantCheckStatus,
} from '../ParticipantCheckStatus/index.js';
import { ParticipantStatusBadge } from '../ParticipantStatusBadge/index.js';

/*
 * Tarjeta de consulta de un participante de cohorte (RF-125). Muestra
 * EXCLUSIVAMENTE los datos administrativos autorizados: código
 * seudonimizado, estado en la cohorte, registro, consentimiento, línea
 * base y motivos de validación pendiente. Cualquier otro campo que
 * traiga la fuente (correo, nombre, documento, consumo, resultados) se
 * ignora. Sin `removeAction` es de solo lectura; con él ofrece retirar
 * al participante de la cohorte ({ busy, onClick }). Nunca edita.
 */
const CHECKS = Object.freeze([
  Object.freeze({ check: PARTICIPANT_CHECK.REGISTRATION, label: 'Registro', field: 'registrationStatus' }),
  Object.freeze({ check: PARTICIPANT_CHECK.CONSENT, label: 'Consentimiento informado', field: 'consentStatus' }),
  Object.freeze({ check: PARTICIPANT_CHECK.BASELINE, label: 'Línea base', field: 'baselineStatus' }),
]);

// Motivos tal como los informa la fuente; se descartan los vacíos.
function toReasons(value) {
  return Array.isArray(value)
    ? value.filter((reason) => typeof reason === 'string' && reason.trim())
    : [];
}

export function ParticipantCard({ participant, removeAction = null }) {
  const code = participant.code?.trim();
  const reasons = toReasons(participant.pendingReasons);
  const isPending = participant.participationStatus === PARTICIPATION_STATUS.PENDING_VALIDATION;

  return (
    <article className="flex h-full flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-2)]">
        <h3 className="m-0 min-w-0 text-[length:var(--font-size-lg)] leading-[var(--line-height-snug)] font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          <span className="sr-only">Participante </span>
          {code ? (
            <span className="font-[family-name:var(--font-mono)]">{code}</span>
          ) : (
            'Código no disponible'
          )}
        </h3>

        <ParticipantStatusBadge status={participant.participationStatus} />
      </div>

      <dl className="m-0 flex flex-col gap-[var(--space-2)] text-[length:var(--font-size-sm)]">
        {CHECKS.map(({ check, label, field }) => (
          <div
            key={check}
            className="flex flex-wrap items-center justify-between gap-x-[var(--space-3)] gap-y-[var(--space-1)] border-b border-[var(--surface-border)] pb-[var(--space-2)] last:border-b-0 last:pb-0"
          >
            <dt className="text-[var(--text-secondary)]">{label}</dt>
            <dd className="m-0">
              <ParticipantCheckStatus check={check} value={participant[field]} />
            </dd>
          </div>
        ))}
      </dl>

      {(isPending || reasons.length > 0 || removeAction) && (
        <div className="mt-auto flex flex-col gap-[var(--space-4)]">
          {(isPending || reasons.length > 0) && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--warning-text)]">
              <p className="m-0 flex items-center gap-[var(--space-2)] font-bold">
                <CircleAlert size={16} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                Motivos de validación pendiente
              </p>

              {reasons.length > 0 ? (
                <ul className="mt-[var(--space-2)] mb-0 flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-6)]">
                  {reasons.map((reason, index) => (
                    <li key={`${index}-${reason}`}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-[var(--space-1)] mb-0">La fuente de datos no indicó motivos.</p>
              )}
            </div>
          )}

          {removeAction && (
            <div className="flex justify-end border-t border-[var(--surface-border)] pt-[var(--space-3)]">
              <Button
                variant="secondary"
                loading={removeAction.busy}
                loadingText="Retirando..."
                onClick={removeAction.onClick}
                className="min-h-[44px]"
              >
                <UserMinus size={16} strokeWidth={1.8} aria-hidden="true" />
                Retirar
                <span className="sr-only"> {code || 'participante sin código'} de la cohorte</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
