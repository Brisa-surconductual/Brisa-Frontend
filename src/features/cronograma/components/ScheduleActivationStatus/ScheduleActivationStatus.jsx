import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { SCHEDULE_ACTIVATION_STATUS } from '@/features/cronograma/types/scheduleTypes.js';

export function ScheduleActivationStatus({
  status = SCHEDULE_ACTIVATION_STATUS.UNKNOWN,
  onActivate,
}) {
  if (status === SCHEDULE_ACTIVATION_STATUS.ACTIVE) {
    return (
      <section
        className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--success-border)] bg-[var(--success-bg)] p-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between"
        aria-label="Estado del cronograma"
      >
        <div className="flex items-start gap-[var(--space-3)]">
          <CheckCircle2
            className="mt-[2px] shrink-0 text-[var(--success-text)]"
            size={22}
            aria-hidden="true"
          />

          <div>
            <h2 className="m-0 text-[14px] font-bold text-[var(--success-text)]">
              Cronograma activo
            </h2>

            <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--success-text)]">
              El cronograma está publicado y asignado a participantes.
            </p>
          </div>
        </div>

        <Button className="shrink-0" disabled>
          Activo
        </Button>
      </section>
    );
  }

  if (status === SCHEDULE_ACTIVATION_STATUS.INACTIVE) {
    return (
      <section
        className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between"
        aria-label="Estado del cronograma"
      >
        <div>
          <h2 className="m-0 text-[14px] font-bold text-[var(--brand-700)]">
            Cronograma inactivo
          </h2>

          <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--brand-600)]">
            Activa el cronograma cuando esté listo para asignar a participantes.
          </p>
        </div>

        <Button className="shrink-0" onClick={onActivate}>
          Activar
        </Button>
      </section>
    );
  }

  return (
    <section
      className="rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)]"
      aria-label="Estado del cronograma"
    >
      <h2 className="m-0 text-[14px] font-bold text-[var(--text-primary)]">
        Estado no disponible
      </h2>

      <p className="mt-[var(--space-1)] mb-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
        No hay información disponible sobre el estado del cronograma en este
        momento.
      </p>
    </section>
  );
}
