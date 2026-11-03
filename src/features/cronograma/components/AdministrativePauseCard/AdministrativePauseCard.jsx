import { Ban, CalendarRange, CircleCheck, CirclePause, ShieldUser } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import {
  ADMINISTRATIVE_PAUSE_STATUS,
  ADMINISTRATIVE_PAUSE_STATUS_LABEL,
} from '@/features/cronograma/types/administrativePauseTypes.js';

import { StatusChip } from '../StatusChip/index.js';

// Presentación del estado que envía el backend; un valor
// desconocido se muestra tal cual, en tono neutro.
const STATUS_PRESENTATION = Object.freeze({
  [ADMINISTRATIVE_PAUSE_STATUS.ACTIVA]: Object.freeze({ tone: 'warning', icon: CirclePause }),
  [ADMINISTRATIVE_PAUSE_STATUS.FINALIZADA]: Object.freeze({ tone: 'success', icon: CircleCheck }),
  [ADMINISTRATIVE_PAUSE_STATUS.ANULADA]: Object.freeze({ tone: 'neutral', icon: Ban }),
});

export function AdministrativePauseCard({ pause, onAnnul, disabled = false }) {
  const {
    fechaInicio,
    fechaFin,
    motivo,
    estado,
    correoElectronico,
    correoUsuarioAdministrativo,
  } = pause;

  const statusLabel = ADMINISTRATIVE_PAUSE_STATUS_LABEL[estado] ?? estado;
  const presentation = STATUS_PRESENTATION[estado];
  // Solo una pausa activa se puede anular (regla existente).
  const canAnnul = estado === ADMINISTRATIVE_PAUSE_STATUS.ACTIVA;
  const isAnnulled = estado === ADMINISTRATIVE_PAUSE_STATUS.ANULADA;

  const emailAfectado = correoElectronico?.value || correoElectronico || 'Desconocido';
  const emailAdmin = correoUsuarioAdministrativo?.value || correoUsuarioAdministrativo || 'N/A';

  const fechaInicioLimpia = fechaInicio ? fechaInicio.split('T')[0] : 'N/A';
  const fechaFinLimpia = fechaFin ? fechaFin.split('T')[0] : 'N/A';

  return (
    <article
      className={`flex h-full flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border p-[var(--space-4)] sm:p-[var(--space-5)] ${
        isAnnulled
          ? 'border-dashed border-[var(--surface-border)] bg-[var(--surface-bg)]'
          : 'border-[var(--surface-border)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]'
      } ${canAnnul ? 'border-l-[4px] border-l-[var(--warning)]' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div className="min-w-0">
          <p className="m-0 text-[length:var(--font-size-xs)] font-bold text-[var(--text-muted)]">
            Participante
          </p>
          <h3 className="mt-[2px] mb-0 text-[length:var(--font-size-base)] font-extrabold [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {emailAfectado}
          </h3>
        </div>

        <StatusChip tone={presentation?.tone ?? 'neutral'} icon={presentation?.icon}>
          {statusLabel ?? 'Sin estado'}
        </StatusChip>
      </div>

      <dl className="m-0 flex flex-col gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
        <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <CalendarRange size={15} strokeWidth={1.8} aria-hidden="true" />
            Periodo
          </dt>
          <dd className="m-0 font-semibold text-[var(--text-primary)] tabular-nums">
            {fechaInicioLimpia} al {fechaFinLimpia}
          </dd>
        </div>

        <div>
          <dt className="text-[var(--text-muted)]">Motivo de la pausa</dt>
          <dd className="m-0 mt-[var(--space-1)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-[var(--space-3)] py-[var(--space-2)] leading-[var(--line-height-normal)] [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {motivo}
          </dd>
        </div>

        <div className="flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)] text-[length:var(--font-size-xs)]">
          <dt className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-muted)]">
            <ShieldUser size={14} strokeWidth={1.8} aria-hidden="true" />
            Registrada por
          </dt>
          <dd className="m-0 font-bold [overflow-wrap:anywhere] text-[var(--text-secondary)]">
            {emailAdmin}
          </dd>
        </div>
      </dl>

      {canAnnul && (
        <div className="mt-auto flex justify-end border-t border-[var(--surface-border)] pt-[var(--space-4)]">
          <Button variant="secondary" disabled={disabled} onClick={onAnnul}>
            <span className="inline-flex items-center gap-[var(--space-2)] text-[var(--danger-text)]">
              <Ban size={17} strokeWidth={1.8} aria-hidden="true" />
              Anular pausa
              <span className="sr-only"> de {emailAfectado}</span>
            </span>
          </Button>
        </div>
      )}
    </article>
  );
}
