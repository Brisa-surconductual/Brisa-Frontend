import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CloudOff,
  Filter,
  FlaskConical,
  Hourglass,
  Info,
  Layers,
  Lock,
  RefreshCw,
  SearchX,
  ShieldAlert,
  TrendingUp,
  Waves,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { CohortNotice } from '../../components/CohortNotice/index.js';
import {
  EvolutionDataTable,
  EvolutionLineChart,
  ProgressDistributionChart,
} from '../../components/EvolutionCharts/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { EVOLUTION_STATUS as S } from '../../types/cohortEvolution.js';
import { COHORTS_PATH, getCohortDetailPath } from '../../utils/cohortRoutes.js';
import { EVOLUTION_MESSAGE } from '../../utils/evolutionMessages.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

import { useCohortEvolution } from './hooks/useCohortEvolution.js';

// Se monta de nuevo al cambiar de cohorte: nunca quedan datos de otra.
export function CohortEvolutionPage() {
  const { idCohorte } = useParams();

  return <CohortEvolution key={idCohorte ?? ''} />;
}

function RetryButton({ onRetry }) {
  return (
    <Button variant="secondary" onClick={onRetry}>
      <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
      Reintentar
    </Button>
  );
}

function ChartCard({ id, title, icon: Icon, children }) {
  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className="flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-4)] shadow-[var(--shadow-sm)] transition duration-300 ease-out motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 sm:p-[var(--space-5)]"
    >
      <h2
        id={`${id}-titulo`}
        className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-extrabold text-[var(--text-primary)]"
      >
        <span className="inline-flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-700)]">
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Filtros de RF-135 recibidos de la fuente: solo se muestran.
function AppliedFilters({ filters }) {
  if (!filters) return null;

  const items = [
    filters.therapyModality &&
      `Modalidad terapéutica: ${filters.therapyModality}`,
    filters.dateRange &&
      `Rango de fechas: ${filters.dateRange.from ?? '…'} a ${filters.dateRange.to ?? '…'}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-[var(--space-2)]">
      <span className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
        <Filter size={14} strokeWidth={1.8} aria-hidden="true" />
        Filtros aplicados
      </span>
      {items.map((item) => (
        <span
          key={item}
          className="rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-3)] py-[2px] text-[length:var(--font-size-xs)] font-semibold text-[var(--text-secondary)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EvolutionState({ view, onRetry }) {
  switch (view?.status) {
    case S.INSUFFICIENT_UNITS:
      return (
        <CohortNotice
          tone="neutral"
          icon={Hourglass}
          title="Evolución aún no disponible"
          role="status"
        >
          {EVOLUTION_MESSAGE.INSUFFICIENT_UNITS}
        </CohortNotice>
      );

    case S.NO_DATA:
      return (
        <CohortNotice
          tone="neutral"
          icon={Info}
          title="Sin datos consolidados"
          role="status"
        >
          Ninguna unidad temporal transcurrida cuenta todavía con datos
          consolidados por el módulo de seguimiento.
        </CohortNotice>
      );

    case S.NO_FILTER_RESULTS:
      return (
        <div className="flex flex-col gap-[var(--space-3)]">
          <AppliedFilters filters={view.filters} />
          <CohortNotice
            tone="neutral"
            icon={SearchX}
            title="Sin resultados para los filtros"
            role="status"
          >
            {EVOLUTION_MESSAGE.NO_FILTER_RESULTS}
          </CohortNotice>
        </div>
      );

    case S.NOT_FOUND:
      return (
        <CohortNotice
          tone="neutral"
          icon={SearchX}
          title="Cohorte no disponible"
          role="alert"
          action={
            <Link
              to={COHORTS_PATH}
              className="inline-flex min-h-[44px] items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline hover:bg-[var(--surface-hover)]"
            >
              <Layers size={16} strokeWidth={1.8} aria-hidden="true" />
              Ir a Cohortes
            </Link>
          }
        >
          {EVOLUTION_MESSAGE.NOT_FOUND}
        </CohortNotice>
      );

    case S.FORBIDDEN:
      return (
        <CohortNotice
          tone="danger"
          icon={ShieldAlert}
          title="Acceso no permitido"
          role="alert"
        >
          {EVOLUTION_MESSAGE.FORBIDDEN}
        </CohortNotice>
      );

    case S.UNAVAILABLE:
      return (
        <CohortNotice
          tone="warning"
          icon={CloudOff}
          title="Evolución no disponible"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          {EVOLUTION_MESSAGE.UNAVAILABLE}
        </CohortNotice>
      );

    default:
      return (
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title="No se pudo construir la evolución"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          {EVOLUTION_MESSAGE.ERROR}
        </CohortNotice>
      );
  }
}

function EvolutionContent({ view, isDemo }) {
  const { units, updatedAt, filters, hasGaps } = view;

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="flex flex-col gap-[var(--space-2)]">
        <AppliedFilters filters={filters} />
        <p className="m-0 inline-flex flex-wrap items-center gap-x-[var(--space-2)] text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
          <Lock size={14} strokeWidth={2} aria-hidden="true" />
          Datos agregados de la cohorte por unidad del cronograma: no
          identifican a ningún participante.{' '}
          {updatedAt ? (
            <span>
              Actualizado el{' '}
              <time dateTime={updatedAt} className="font-bold">
                {formatAuditTimestamp(updatedAt)}
              </time>{' '}
              (hora de Colombia
              {isDemo ? '; fecha ficticia de la demostración' : ''}).
            </span>
          ) : (
            'Fecha de actualización no disponible.'
          )}
        </p>
      </div>

      {hasGaps && (
        <CohortNotice
          tone="info"
          icon={Info}
          title="Unidades sin datos"
          role="note"
        >
          {EVOLUTION_MESSAGE.GAPS}
        </CohortNotice>
      )}

      <ChartCard
        id="evolucion-adherencia"
        title="Adherencia promedio"
        icon={Activity}
      >
        <EvolutionLineChart
          units={units}
          valueKey="adherence"
          indicator="adherencia promedio"
        />
      </ChartCard>

      <ChartCard
        id="evolucion-progreso"
        title="Distribución por nivel de progreso"
        icon={BarChart3}
      >
        <ProgressDistributionChart units={units} />
      </ChartCard>

      <ChartCard id="evolucion-craving" title="Craving promedio" icon={Waves}>
        <EvolutionLineChart
          units={units}
          valueKey="craving"
          indicator="craving promedio"
        />
      </ChartCard>

      <EvolutionDataTable units={units} />
    </div>
  );
}

/*
 * Evolución temporal de indicadores de una cohorte
 * (/cohortes/:idCohorte/evolucion, RF-141). Solo consulta y solo
 * agregados por unidad del cronograma (RF-55): adherencia promedio,
 * distribución de niveles de progreso y craving promedio, cada uno en su
 * propio gráfico y eje. La página compone; el estado vive en
 * useCohortEvolution.
 */
function CohortEvolution() {
  const { idCohorte } = useParams();
  const cohortId = idCohorte ?? null;
  const { cohort, view, isLoading, isDemo, retry } = useCohortEvolution({
    cohortId,
  });

  const cohortName = cohort?.name?.trim();

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={cohortId ? getCohortDetailPath(cohortId) : COHORTS_PATH}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Volver a la cohorte
      </Link>

      <header className="flex flex-col gap-[var(--space-2)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración · Cohortes
        </p>
        <h1 className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          <TrendingUp
            size={28}
            strokeWidth={1.8}
            className="shrink-0 text-[var(--brand-600)]"
            aria-hidden="true"
          />
          Evolución temporal de indicadores
        </h1>
        <p className="m-0 max-w-[720px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Cómo cambian la adherencia, el nivel de progreso y el craving promedio
          de la cohorte entre unidades consecutivas del cronograma, tal como los
          consolida el módulo de seguimiento.
        </p>
      </header>

      {cohortName && (
        <p className="m-0 flex min-w-0 items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)]">
          <Layers
            size={20}
            strokeWidth={1.8}
            className="shrink-0 text-[var(--brand-600)]"
            aria-hidden="true"
          />
          <span className="flex min-w-0 flex-col">
            <span className="text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
              Cohorte consultada
            </span>
            <span className="text-[length:var(--font-size-lg)] leading-[var(--line-height-tight)] font-extrabold break-words text-[var(--text-primary)]">
              {cohortName}
            </span>
          </span>
        </p>
      )}

      <ReadOnlyNotice>
        Consulta de solo lectura: los valores provienen del módulo de
        seguimiento, no se recalculan ni se interpolan. Solo se muestran
        agregados de la cohorte.
      </ReadOnlyNotice>

      {isDemo && (
        <CohortNotice
          tone="warning"
          icon={FlaskConical}
          title="Datos de demostración"
          role="note"
        >
          Serie ficticia del modo de desarrollo. No proviene del módulo de
          seguimiento ni del servidor.
        </CohortNotice>
      )}

      <section
        aria-label="Evolución por unidad del cronograma"
        aria-busy={isLoading}
        className="flex flex-col gap-[var(--space-4)]"
      >
        {isLoading ? (
          <>
            <p role="status" className="sr-only">
              Cargando la evolución temporal...
            </p>
            <div
              aria-hidden="true"
              className="h-[240px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
            />
          </>
        ) : view?.status === S.READY ? (
          <EvolutionContent view={view} isDemo={isDemo} />
        ) : (
          <EvolutionState view={view} onRetry={retry} />
        )}
      </section>
    </div>
  );
}
