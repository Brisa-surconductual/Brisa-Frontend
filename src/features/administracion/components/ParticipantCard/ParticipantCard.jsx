import { CircleAlert } from 'lucide-react';

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
 * ignora. Es de solo lectura: no ofrece asignar, retirar ni editar.
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

export function ParticipantCard({ participant }) {
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

      {(isPending || reasons.length > 0) && (
        <div className="mt-auto rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)] p-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--warning-text)]">
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
    </article>
  );
}
