import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  FilterX,
  FlaskConical,
  PlugZap,
  RefreshCw,
  SearchX,
  ShieldAlert,
  ShieldX,
  UsersRound,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { CohortNotice } from '../../components/CohortNotice/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { TrackingControls } from '../../components/TrackingControls/index.js';
import { TrackingEntryCard } from '../../components/TrackingEntryCard/index.js';
import { TrackingPagination } from '../../components/TrackingPagination/index.js';
import { getCohortDetailPath, getParticipantTrackingPath } from '../../utils/cohortRoutes.js';

import { TRACKING_PROBLEM, useParticipantTracking } from './hooks/useParticipantTracking.js';

// El seguimiento de cada cohorte se monta de nuevo al cambiar la ruta, como
// la ficha: ni el encabezado, ni los registros, ni los filtros, el orden
// o la página de otra cohorte quedan visibles ni se aplican a la nueva.
export function ParticipantTrackingPage() {
  const { idCohorte } = useParams();

  return <ParticipantTracking key={idCohorte ?? ''} />;
}

/*
 * Seguimiento de los participantes de una cohorte
 * (/cohortes/:idCohorte/seguimiento, RF-142). Solo consulta: no ofrece
 * editar indicadores. Cada participante con referencia opaca enlaza a
 * su ficha individual (RF-128). La página solo compone; el estado vive
 * en useParticipantTracking.
 */
function ParticipantTracking() {
  const { idCohorte } = useParams();
  const cohortId = idCohorte ?? null;
  const {
    cohort,
    entries,
    blockedCount,
    total,
    range,
    pageNumber,
    pageCount,
    canGoBack,
    canGoForward,
    filters,
    sortValue,
    hasFilters,
    isLoading,
    problem,
    isDemo,
    isIntegrationPending,
    setFilter,
    setSort,
    clearFilters,
    goBack,
    goForward,
    retry,
  } = useParticipantTracking({ cohortId });

  const cohortName = cohort?.name?.trim();
  const isReady = !isLoading && !problem;
  const isEmpty = isReady && total === 0;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={cohortId ? getCohortDetailPath(cohortId) : '/app/administrativo/cohortes'}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Volver a la cohorte
      </Link>

      <header className="flex flex-col gap-[var(--space-2)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración · Cohortes
        </p>

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Seguimiento de participantes
        </h1>

        <p className="m-0 max-w-[680px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          {cohortName ? (
            <>Indicadores de progreso, adherencia y alertas activas de «{cohortName}».</>
          ) : (
            'Indicadores de progreso, adherencia y alertas activas de los participantes de la cohorte.'
          )}
        </p>
      </header>

      {!isIntegrationPending && (
        <ReadOnlyNotice>
          Consulta de solo lectura: los indicadores provienen del módulo de
          seguimiento y no pueden modificarse desde aquí. Solo se muestran
          códigos seudonimizados; el contenido del diario y del chat no se
          incluye.
        </ReadOnlyNotice>
      )}

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Datos de demostración" role="note">
          Indicadores ficticios del modo de desarrollo. No representan datos
          reales de seguimiento ni se calculan a partir de la elegibilidad de
          la cohorte. La autorización mostrada también es simulada.
        </CohortNotice>
      )}

      {isIntegrationPending ? (
        <CohortNotice tone="info" icon={PlugZap} title="Información aún no disponible" role="status">
          La consulta de indicadores de seguimiento todavía no está
          disponible. Aquí aparecerán los participantes que tengas
          autorización para consultar cuando lo esté.
        </CohortNotice>
      ) : (
        <section aria-labelledby="indicadores-seguimiento" aria-busy={isLoading} className="flex flex-col gap-[var(--space-4)]">
          <h2 id="indicadores-seguimiento" className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
            Indicadores por participante
          </h2>

          {problem !== TRACKING_PROBLEM.DENIED && problem !== TRACKING_PROBLEM.NOT_FOUND && (
            <TrackingControls
              filters={filters}
              sortValue={sortValue}
              hasFilters={hasFilters}
              disabled={isLoading}
              onFilter={setFilter}
              onSort={setSort}
              onClearFilters={clearFilters}
            />
          )}

          {isLoading && (
            <>
              <p role="status" className="sr-only">
                Cargando indicadores de seguimiento...
              </p>
              <ul className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <li
                    key={index}
                    className="h-[196px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
                  />
                ))}
              </ul>
            </>
          )}

          {!isLoading && problem === TRACKING_PROBLEM.DENIED && (
            <CohortNotice tone="warning" icon={ShieldX} title="Acceso denegado" role="alert">
              No cuenta con autorización para consultar los indicadores
              individuales de esta cohorte.
              {isDemo && ' Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.'}
            </CohortNotice>
          )}

          {!isLoading && problem === TRACKING_PROBLEM.NOT_FOUND && (
            <CohortNotice tone="neutral" icon={SearchX} title="Cohorte no encontrada" role="alert">
              La cohorte solicitada no existe en el sistema.
            </CohortNotice>
          )}

          {!isLoading && problem === TRACKING_PROBLEM.INCONSISTENT && (
            <CohortNotice
              tone="danger"
              icon={ShieldAlert}
              title="Información no mostrada"
              role="alert"
              action={
                <Button variant="secondary" onClick={retry}>
                  <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                  Reintentar
                </Button>
              }
            >
              La información recibida no corresponde a la cohorte solicitada. Por
              seguridad no se muestra ningún registro.
            </CohortNotice>
          )}

          {!isLoading && problem === TRACKING_PROBLEM.ERROR && (
            <CohortNotice
              tone="danger"
              icon={AlertTriangle}
              title="Indicadores no disponibles"
              role="alert"
              action={
                <Button variant="secondary" onClick={retry}>
                  <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                  Reintentar
                </Button>
              }
            >
              No pudimos cargar los indicadores de seguimiento. Intenta nuevamente.
            </CohortNotice>
          )}

          {isReady && blockedCount > 0 && (
            <CohortNotice tone="danger" icon={ShieldAlert} title="Registros bloqueados" role="alert">
              {blockedCount === 1
                ? 'Se ocultó 1 registro que no corresponde a esta cohorte.'
                : `Se ocultaron ${blockedCount} registros que no corresponden a esta cohorte.`}
            </CohortNotice>
          )}

          {isEmpty && !hasFilters && (
            <CohortNotice tone="neutral" icon={UsersRound} title="Sin participantes" role="status">
              No se encontraron participantes registrados para la cohorte
              seleccionada.
            </CohortNotice>
          )}

          {isEmpty && hasFilters && (
            <CohortNotice
              tone="neutral"
              icon={FilterX}
              title="Sin resultados"
              role="status"
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            >
              Ningún participante coincide con los filtros aplicados.
            </CohortNotice>
          )}

          {isReady && entries.length > 0 && (
            <>
              <ol className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 xl:grid-cols-3">
                {entries.map((entry, index) => (
                  <li key={entry.code || `sin-codigo-${index}`}>
                    <TrackingEntryCard
                      entry={entry}
                      detailPath={cohortId && entry.reference ? getParticipantTrackingPath(cohortId, entry.reference) : null}
                    />
                  </li>
                ))}
              </ol>

              <TrackingPagination
                range={range}
                total={total}
                pageNumber={pageNumber}
                pageCount={pageCount}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={goForward}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
