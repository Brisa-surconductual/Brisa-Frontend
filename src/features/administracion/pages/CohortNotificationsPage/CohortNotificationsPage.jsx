import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BellRing,
  FlaskConical,
  Layers,
  PlugZap,
} from 'lucide-react';

import { CohortNotice } from '../../components/CohortNotice/index.js';
import { NotificationAggregateView } from '../../components/NotificationAggregateView/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { StaleBadge } from '../../components/StaleDataNotice/index.js';
import { AGGREGATE_VIEW_STATUS } from '../../types/behavioralAggregate.js';
import { COHORTS_PATH, getCohortDetailPath } from '../../utils/cohortRoutes.js';

import { useCohortNotifications } from './hooks/useCohortNotifications.js';

// Se monta de nuevo al cambiar de cohorte: la vista de otra cohorte nunca
// queda visible ni se mezcla con la nueva.
export function CohortNotificationsPage() {
  const { idCohorte } = useParams();

  return <CohortNotifications key={idCohorte ?? ''} />;
}

/*
 * Vista agregada de efectividad de notificaciones de una cohorte
 * (/cohortes/:idCohorte/vista-notificaciones, RF-134). Solo consulta y
 * solo agregados: no muestra participantes, historial ni contenido de
 * mensajes, ni enlaza a fichas. Independiente de las vistas conductual
 * (RF-132) y narrativa (RF-133). La página compone; el estado vive en
 * useCohortNotifications.
 */
function CohortNotifications() {
  const { idCohorte } = useParams();
  const cohortId = idCohorte ?? null;
  const { cohort, view, isLoading, isDemo, isIntegrationPending, retry } =
    useCohortNotifications({ cohortId });

  const cohortName = cohort?.name?.trim();
  const isStale = !isLoading && view?.status === AGGREGATE_VIEW_STATUS.STALE;

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

        <h1 className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]">
          Efectividad de notificaciones
        </h1>

        <p className="m-0 max-w-[680px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Métricas agregadas del acompañamiento por notificaciones de la
          cohorte: tasas promedio de apertura y conversión, y notificaciones
          enviadas, entregadas y descartadas, tal como las entrega el módulo de
          notificaciones.
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

      {!isIntegrationPending && (
        <ReadOnlyNotice>
          Consulta de solo lectura: las métricas provienen del módulo de
          notificaciones, no se recalculan ni pueden modificarse desde aquí.
          Solo se muestran agregados de la cohorte.
        </ReadOnlyNotice>
      )}

      {isDemo && (
        <CohortNotice
          tone="warning"
          icon={FlaskConical}
          title="Datos de demostración"
          role="note"
        >
          Vista ficticia del modo de desarrollo. No proviene del módulo de
          notificaciones ni del servidor, y no se calcula a partir de los
          participantes de la cohorte.
        </CohortNotice>
      )}

      {isIntegrationPending ? (
        <CohortNotice
          tone="info"
          icon={PlugZap}
          title="Integración pendiente"
          role="status"
        >
          La vista de efectividad de notificaciones todavía no está conectada al
          módulo de notificaciones. Cuando se integre, aquí aparecerán las
          métricas agregadas de la cohorte.
        </CohortNotice>
      ) : (
        <section
          aria-labelledby="vista-notificaciones"
          aria-busy={isLoading}
          className="flex flex-col gap-[var(--space-4)]"
        >
          <h2
            id="vista-notificaciones"
            className="m-0 inline-flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
          >
            <BellRing size={20} strokeWidth={1.8} aria-hidden="true" />
            Indicadores de notificaciones
            {isStale && <StaleBadge />}
          </h2>

          {isLoading ? (
            <>
              <p role="status" className="sr-only">
                Cargando la vista de notificaciones...
              </p>
              <div
                aria-hidden="true"
                className="h-[160px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              />
            </>
          ) : (
            <NotificationAggregateView
              view={view}
              isDemo={isDemo}
              onRetry={retry}
            />
          )}
        </section>
      )}
    </div>
  );
}
