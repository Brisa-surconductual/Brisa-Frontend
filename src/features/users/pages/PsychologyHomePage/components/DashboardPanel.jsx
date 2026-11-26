import {
  AlertTriangle,
  CalendarClock,
  RefreshCw,
  UserCheck,
  UserRoundPen,
  Users,
} from 'lucide-react';

import { PROGRAM_STATS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';
import { Button } from '@/shared/components/ui/Button/index.js';

import { useProgramStats } from '../hooks/useProgramStats.js';
import { DashboardShortcuts } from './DashboardShortcuts.jsx';
import { StatCard } from './StatCard.jsx';

const STAT_ICON = Object.freeze({
  ACTIVOS: Users,
  COMPLETO: UserCheck,
  PENDIENTE: UserRoundPen,
  DURACION_BASE: CalendarClock,
});

/*
 * Resumen agregado y anónimo del programa. Solo las cuatro
 * cifras que entrega GET /usuarios/estadisticas-programa: sin
 * porcentajes, tendencias ni datos individuales.
 */
export function DashboardPanel() {
  const { stats, loading, error, retry } = useProgramStats();

  const durationUnavailable =
    !loading && !error && stats?.diasCronogramaBase === null;

  return (
    <div className="flex flex-col gap-[var(--space-8)]">
      <section
        aria-labelledby="indicadores-titulo"
        aria-busy={loading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <div className="flex flex-wrap items-end justify-between gap-[var(--space-3)]">
          <div className="flex flex-col gap-[var(--space-1)]">
            <h2
              id="indicadores-titulo"
              className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
            >
              Indicadores del programa
            </h2>

            <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-secondary)]">
              Cuentas de estudiantes activas. La duración corresponde al
              cronograma base activo.
            </p>
          </div>

          {!error && (
            <Button
              variant="secondary"
              size="small"
              disabled={loading}
              onClick={retry}
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
              Actualizar estadísticas
            </Button>
          )}
        </div>

        {loading && (
          <p role="status" className="sr-only">
            Consultando estadísticas...
          </p>
        )}

        {error && (
          <div
            className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)] p-[var(--space-4)] text-[var(--danger-text)] sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div className="flex items-start gap-[var(--space-3)]">
              <AlertTriangle
                size={20}
                strokeWidth={1.8}
                className="mt-[2px] shrink-0"
                aria-hidden="true"
              />

              <div>
                <strong className="block text-[length:var(--font-size-sm)]">
                  Estadísticas no disponibles
                </strong>
                <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-sm)]">
                  {error}
                </p>
              </div>
            </div>

            <Button variant="secondary" size="small" onClick={retry}>
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
              Reintentar consulta
            </Button>
          </div>
        )}

        <ul className="m-0 grid list-none grid-cols-2 gap-[var(--space-3)] p-0 md:gap-[var(--space-4)] xl:grid-cols-4">
          {PROGRAM_STATS.map(({ id, key, label, unit, tone }) => (
            <StatCard
              key={id}
              id={id}
              label={label}
              unit={unit}
              tone={tone}
              icon={STAT_ICON[id]}
              value={stats?.[key] ?? null}
              loading={loading}
              failed={Boolean(error)}
            />
          ))}
        </ul>

        {durationUnavailable && (
          <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
            La duración estará disponible cuando haya un cronograma base
            activo con unidades temporales.
          </p>
        )}
      </section>

      <DashboardShortcuts />
    </div>
  );
}
