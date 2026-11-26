import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CloudOff,
  FilterX,
  FlaskConical,
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
import { TrackingTable } from '../../components/TrackingTable/index.js';
import { effectiveSort, nextColumnSort } from '../../services/trackingQuery.js';
import { getCohortDetailPath, getParticipantTrackingPath } from '../../utils/cohortRoutes.js';

import { TRACKING_PROBLEM, useParticipantTracking } from './hooks/useParticipantTracking.js';

const LOGIN_PATH = '/login';

// Avisos de los problemas del listado. Ninguno deja registros visibles.
const PROBLEM_NOTICE = Object.freeze({
  [TRACKING_PROBLEM.INVALID_QUERY]: Object.freeze({
    tone: 'warning', icon: FilterX, title: 'Filtros no válidos',
    message: 'Los filtros aplicados no son válidos. Límpialos e inténtalo de nuevo.',
  }),
  [TRACKING_PROBLEM.DENIED]: Object.freeze({
    tone: 'warning', icon: ShieldX, title: 'Acceso denegado',
    message: 'No cuenta con autorización para consultar los indicadores de los participantes de esta cohorte.',
  }),
  [TRACKING_PROBLEM.NOT_FOUND]: Object.freeze({
    tone: 'neutral', icon: SearchX, title: 'Cohorte no encontrada',
    message: 'La cohorte solicitada no existe en el sistema.',
  }),
  [TRACKING_PROBLEM.UNAVAILABLE]: Object.freeze({
    tone: 'warning', icon: CloudOff, title: 'Módulo no disponible',
    message: 'El módulo de seguimiento no se encuentra disponible en este momento.',
  }),
  [TRACKING_PROBLEM.INVALID_RESPONSE]: Object.freeze({
    tone: 'danger', icon: ShieldAlert, title: 'Información no mostrada',
    message: 'La información recibida no tiene el formato esperado. Por seguridad no se muestra ningún registro.',
  }),
  [TRACKING_PROBLEM.ERROR]: Object.freeze({
    tone: 'danger', icon: AlertTriangle, title: 'Indicadores no disponibles',
    message: 'No pudimos cargar los indicadores de seguimiento. Intenta nuevamente.',
  }),
});

// Problemas tras los que no se ofrecen filtros: no hay nada que filtrar.
const WITHOUT_CONTROLS = Object.freeze([TRACKING_PROBLEM.DENIED, TRACKING_PROBLEM.NOT_FOUND]);

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
 * editar indicadores. Cada participante enlaza a su ficha individual
 * (RF-128) con su código seudonimizado. La página solo compone; el
 * estado vive en useParticipantTracking y la consulta, en la URL (filtros,
 * orden y página se conservan al recargar o al volver de una ficha).
 * En pantallas anchas los registros se muestran en una tabla con
 * encabezados ordenables; en las estrechas, como tarjetas. Ambas vistas
 * presentan las mismas filas de la misma respuesta.
 */
function ParticipantTracking() {
  const { idCohorte } = useParams();
  const cohortId = idCohorte ?? null;
  const { search } = useLocation();
  const navigate = useNavigate();
  const {
    cohort,
    entries,
    total,
    range,
    pageNumber,
    pageCount,
    canGoBack,
    canGoForward,
    filters,
    sort,
    sortValue,
    hasFilters,
    isLoading,
    problem,
    canRetry,
    isDemo,
    setFilter,
    setSort,
    setColumnSort,
    clearFilters,
    goBack,
    goForward,
    retry,
  } = useParticipantTracking({ cohortId, search, navigate });

  if (problem === TRACKING_PROBLEM.SESSION_REQUIRED) return <Navigate to={LOGIN_PATH} replace />;

  const cohortName = cohort?.name?.trim();
  const isReady = !isLoading && !problem;
  const isEmpty = isReady && total === 0;
  const notice = !isLoading && problem ? PROBLEM_NOTICE[problem] : null;
  const rows = entries.map((entry) => ({
    entry,
    detailPath: cohortId && entry.detailCode ? getParticipantTrackingPath(cohortId, entry.detailCode) : null,
  }));

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
            <>Nivel de progreso, adherencia y alertas de los participantes activos de «{cohortName}».</>
          ) : (
            'Nivel de progreso, adherencia y alertas de los participantes activos de la cohorte.'
          )}
        </p>
      </header>

      <ReadOnlyNotice>
        Consulta de solo lectura: los indicadores provienen del módulo de
        seguimiento y no pueden modificarse desde aquí. Solo se muestran
        códigos seudonimizados; el contenido del diario y del chat no se
        incluye.
      </ReadOnlyNotice>

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Datos de demostración" role="note">
          Indicadores ficticios del modo de desarrollo. No representan datos
          reales de seguimiento ni se calculan a partir de la elegibilidad de
          la cohorte. Las negativas de acceso también son simuladas.
        </CohortNotice>
      )}

      <section aria-labelledby="indicadores-seguimiento" aria-busy={isLoading} className="flex flex-col gap-[var(--space-4)]">
        <h2 id="indicadores-seguimiento" className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
          Indicadores por participante
        </h2>

        {!WITHOUT_CONTROLS.includes(problem) && (
          <TrackingControls
            filters={filters}
            sortValue={sortValue}
            hasFilters={hasFilters}
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

        {notice && (
          <CohortNotice
            tone={notice.tone}
            icon={notice.icon}
            title={notice.title}
            role="alert"
            action={
              canRetry ? (
                <Button variant="secondary" onClick={retry}>
                  <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                  Reintentar
                </Button>
              ) : problem === TRACKING_PROBLEM.INVALID_QUERY ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : null
            }
          >
            {notice.message}
            {problem === TRACKING_PROBLEM.DENIED && isDemo &&
              ' Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.'}
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
            <div className="hidden lg:block">
              <TrackingTable
                rows={rows}
                sort={effectiveSort(sort)}
                onSort={(field) => setColumnSort(nextColumnSort(sort, field))}
              />
            </div>

            <ol className="m-0 grid list-none grid-cols-1 gap-[var(--space-4)] p-0 md:grid-cols-2 lg:hidden">
              {rows.map(({ entry, detailPath }) => (
                <li key={entry.code}>
                  <TrackingEntryCard entry={entry} detailPath={detailPath} />
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
    </div>
  );
}
