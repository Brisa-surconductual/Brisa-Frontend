import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Hourglass,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { useAssignedSchedule } from '../../hooks/useAssignedSchedule.js';
import { ScheduleStatusBadge } from '../ScheduleStatusBadge/index.js';

const BOX_CLASS =
  'rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)]';

/*
 * Cronograma asignado al estudiante. La consulta, los textos y el
 * formato de la fecha (zona de Colombia) son los de siempre.
 */
export function AssignedScheduleSummary() {
  const { schedule, loading, error, retry } = useAssignedSchedule();
  return (
    <div className="min-h-[var(--space-8)]" aria-busy={loading}>
      {loading ? (
        <div
          className={`${BOX_CLASS} border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)]`}
        >
          <p role="status" className="m-0">
            Consultando tu cronograma...
          </p>
        </div>
      ) : error ? (
        <div
          className={`${BOX_CLASS} flex flex-col gap-[var(--space-3)] border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)] sm:flex-row sm:items-center sm:justify-between`}
        >
          <p role="alert" className="m-0 flex items-start gap-[var(--space-2)] font-semibold">
            <AlertTriangle size={18} strokeWidth={1.8} className="mt-[2px] shrink-0" aria-hidden="true" />
            {error}
          </p>
          <Button variant="secondary" onClick={retry} className="shrink-0">
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
            Reintentar consulta
          </Button>
        </div>
      ) : schedule ? (
        <div
          className={`${BOX_CLASS} flex flex-col gap-[var(--space-3)] border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)]`}
        >
          <div className="flex items-start gap-[var(--space-3)]">
            <CalendarCheck
              size={20}
              strokeWidth={1.8}
              className="mt-[2px] shrink-0 text-[var(--brand-600)]"
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              <p className="m-0 font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
                Cronograma asignado: {schedule.nombre}
              </p>
              {schedule.estado && (
                <span className="w-fit">
                  <ScheduleStatusBadge status={schedule.estado} />
                </span>
              )}
              <p className="m-0 inline-flex flex-wrap items-center gap-[var(--space-2)]">
                <CalendarClock size={15} strokeWidth={1.8} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                Inicio de tu programa:{' '}
                <time
                  dateTime={schedule.fecha_inicio_usuario}
                  className="font-semibold text-[var(--text-primary)]"
                >
                  {new Intl.DateTimeFormat('es-CO', {
                    dateStyle: 'long',
                    timeZone: 'America/Bogota',
                  }).format(new Date(schedule.fecha_inicio_usuario))}
                </time>
              </p>
            </div>
          </div>

          {schedule.estado === 'INACTIVO' && (
            <p
              role="status"
              className="m-0 flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--info-border)] bg-[var(--info-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--info-text)]"
            >
              <Hourglass size={16} strokeWidth={1.8} className="mt-[3px] shrink-0" aria-hidden="true" />
              El equipo administrador está preparando tu cronograma. Tu
              asignación se conserva mientras termina la configuración y lo
              activa.
            </p>
          )}
        </div>
      ) : (
        <div
          className={`${BOX_CLASS} flex flex-col gap-[var(--space-3)] border-dashed border-[var(--surface-border)] bg-[var(--surface-bg)] text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between`}
        >
          <p className="m-0 flex items-start gap-[var(--space-2)]">
            <Hourglass size={18} strokeWidth={1.8} className="mt-[2px] shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            Tu cronograma está pendiente de asignación. Se asignará
            automáticamente cuando haya uno activo disponible.
          </p>
          <Button variant="secondary" onClick={retry} className="shrink-0">
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
            Actualizar cronograma
          </Button>
        </div>
      )}
    </div>
  );
}
