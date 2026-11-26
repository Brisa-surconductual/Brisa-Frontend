import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpenText,
  CalendarPlus,
  CalendarRange,
  PauseCircle,
  RefreshCw,
  Route,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { PanelNotice } from '../../components/PanelNotice/index.js';
import { ScheduleCard } from '../../components/ScheduleCard/index.js';

import { useScheduleList } from './hooks/useScheduleList.js';

const SCHEDULES_PATH = '/app/administrativo/cronograma';

/* Herramientas del módulo: mismas acciones y destinos de antes. */
const SCHEDULE_TOOLS = Object.freeze([
  Object.freeze({ label: 'Asignar cronograma a usuario', to: `${SCHEDULES_PATH}/assignar`, Icon: UserPlus }),
  Object.freeze({ label: 'Progreso por usuario', to: `${SCHEDULES_PATH}/progreso`, Icon: Route }),
  Object.freeze({ label: 'Pausas administrativas', to: `${SCHEDULES_PATH}/pausas`, Icon: PauseCircle }),
  Object.freeze({ label: 'Gestionar contenidos', to: `${SCHEDULES_PATH}/contenidos`, Icon: BookOpenText }),
]);

function getPanelPath(schedule) {
  return `${SCHEDULES_PATH}/${encodeURIComponent(schedule.idCronograma)}/panel`;
}

export function ScheduleManagementPage() {
  const navigate = useNavigate();

  const { schedules, isLoading, loadError, retry } = useScheduleList();

  function handleCreateSchedule() {
    navigate(`${SCHEDULES_PATH}/crear`);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-8)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <header className="flex flex-col gap-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-[var(--space-1)]">
            <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
              Administración
            </p>

            <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
              Cronogramas
            </h1>

            <p className="mt-[var(--space-1)] mb-0 max-w-[640px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
              Selecciona un cronograma para ver y gestionar sus unidades
              temporales.
            </p>
          </div>

          <Button onClick={handleCreateSchedule} className="w-full md:w-auto">
            <CalendarPlus size={18} strokeWidth={2} aria-hidden="true" />
            Crear cronograma
          </Button>
        </div>

        <nav
          aria-labelledby="herramientas-cronograma"
          className="rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-3)]"
        >
          <h2
            id="herramientas-cronograma"
            className="m-0 px-[var(--space-2)] pb-[var(--space-2)] text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase"
          >
            Herramientas de gestión
          </h2>

          <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-1)] p-0 sm:grid-cols-2 xl:grid-cols-4">
            {SCHEDULE_TOOLS.map(({ label, to, Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex min-h-[44px] items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] px-[var(--space-3)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-primary)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className="shrink-0 text-[var(--brand-600)]"
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <section
        aria-labelledby="listado-cronogramas"
        aria-busy={isLoading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        <div className="flex items-baseline justify-between gap-[var(--space-3)]">
          <h2
            id="listado-cronogramas"
            className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            Todos los cronogramas
          </h2>

          {!isLoading && !loadError && (
            <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
              {schedules.length}{' '}
              {schedules.length === 1 ? 'cronograma' : 'cronogramas'}
            </span>
          )}
        </div>

        {isLoading && (
          <>
            <p role="status" className="sr-only">
              Cargando cronogramas...
            </p>

            <ul
              className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3"
              aria-hidden="true"
            >
              {[0, 1, 2].map((index) => (
                <li
                  key={index}
                  className="h-[168px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                />
              ))}
            </ul>
          </>
        )}

        {!isLoading && loadError && (
          <PanelNotice
            tone="danger"
            icon={AlertTriangle}
            title="Cronogramas no disponibles"
            role="alert"
            action={
              <Button
                variant="secondary"
                size="small"
                onClick={retry}
              >
                <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                Reintentar
              </Button>
            }
          >
            {loadError}
          </PanelNotice>
        )}

        {!isLoading && !loadError && schedules.length === 0 && (
          <PanelNotice
            tone="neutral"
            icon={CalendarRange}
            title="Aún no hay cronogramas"
            role="status"
          >
            Crea el primer cronograma para empezar a organizar las unidades
            temporales del programa.
          </PanelNotice>
        )}

        {!isLoading && !loadError && schedules.length > 0 && (
          <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3">
            {schedules.map((schedule, index) => (
              <li key={schedule.idCronograma ?? index} className="flex">
                <div className="flex-1">
                  <ScheduleCard
                    schedule={schedule}
                    panelPath={getPanelPath(schedule)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
