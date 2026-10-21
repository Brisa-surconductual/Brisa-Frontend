import { Button } from '@/shared/components/ui/Button/index.js';
import { useAssignedSchedule } from '../../hooks/useAssignedSchedule.js';

export function AssignedScheduleSummary() {
  const { schedule, loading, error, retry } = useAssignedSchedule();
  return (
    <div
      className="mt-[var(--space-3)] min-h-[var(--space-8)] text-[13px] leading-[1.6] text-[var(--text-secondary)]"
      aria-busy={loading}
    >
      {loading ? (
        <p role="status">Consultando tu cronograma...</p>
      ) : error ? (
        <>
          <p role="alert" className="text-[var(--danger-text)]">
            {error}
          </p>
          <Button variant="secondary" onClick={retry}>
            Reintentar consulta
          </Button>
        </>
      ) : schedule ? (
        <>
          <p className="m-0 font-bold text-[var(--text-primary)]">
            Cronograma asignado: {schedule.nombre}
          </p>
          {schedule.estado === 'INACTIVO' && (
            <p role="status" className="m-0">
              El equipo administrador está preparando tu cronograma. Tu
              asignación se conserva mientras termina la configuración y lo
              activa.
            </p>
          )}
          <p className="m-0">
            Inicio de tu programa:{' '}
            <time dateTime={schedule.fecha_inicio_usuario}>
              {new Intl.DateTimeFormat('es-CO', {
                dateStyle: 'long',
                timeZone: 'America/Bogota',
              }).format(new Date(schedule.fecha_inicio_usuario))}
            </time>
          </p>
        </>
      ) : (
        <>
          <p className="m-0">
            Tu cronograma está pendiente de asignación. Se asignará
            automáticamente cuando haya uno activo disponible.
          </p>
          <Button variant="secondary" onClick={retry}>
            Actualizar cronograma
          </Button>
        </>
      )}
    </div>
  );
}
