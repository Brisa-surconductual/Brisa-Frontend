import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BellRing,
  BookOpen,
  CloudOff,
  FlaskConical,
  History,
  Layers,
  RefreshCw,
  SearchX,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { useCohortDashboard } from '../../hooks/useCohortDashboard.js';
import {
  DASHBOARD_SECTION,
  DASHBOARD_STATUS,
  PANEL_SOURCE,
} from '../../types/cohortDashboard.js';
import {
  COHORTS_PATH,
  getCohortAggregatePath,
  getCohortDetailPath,
  getCohortEvolutionPath,
  getCohortNarrativePath,
  getCohortNotificationsPath,
  getCohortTrackingPath,
} from '../../utils/cohortRoutes.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { viewHasData } from '../../services/cohortDashboard.js';
import { CohortNotice } from '../CohortNotice/index.js';
import { SectionErrorBoundary } from '../SectionErrorBoundary/index.js';

import { BehavioralSummary } from './BehavioralSummary.jsx';
import { CriticalAlertsCard } from './CriticalAlertsCard.jsx';
import { DashboardWidget } from './DashboardWidget.jsx';
import { NarrativeSummary } from './NarrativeSummary.jsx';
import { NotificationSummary } from './NotificationSummary.jsx';

// Secciones en el orden de prioridad de RF-140.
const SECTIONS = Object.freeze([
  Object.freeze({
    key: DASHBOARD_SECTION.BEHAVIORAL,
    id: 'panel-conducta',
    title: 'Conducta y adherencia',
    dimension: 'conducta y adherencia',
    icon: Activity,
    moduleLabel: 'seguimiento',
    detailLabel: 'Ver detalle',
    detailPath: getCohortAggregatePath,
    Summary: BehavioralSummary,
  }),
  Object.freeze({
    key: DASHBOARD_SECTION.NARRATIVE,
    id: 'panel-narrativa',
    title: 'Progresión narrativa y gamificación',
    dimension: 'progresión narrativa',
    icon: BookOpen,
    moduleLabel: 'gamificación',
    detailLabel: 'Ver detalle',
    detailPath: getCohortNarrativePath,
    Summary: NarrativeSummary,
  }),
  Object.freeze({
    key: DASHBOARD_SECTION.NOTIFICATIONS,
    id: 'panel-notificaciones',
    title: 'Efectividad de notificaciones',
    dimension: 'notificaciones',
    icon: BellRing,
    moduleLabel: 'notificaciones',
    detailLabel: 'Ver detalle',
    detailPath: getCohortNotificationsPath,
    Summary: NotificationSummary,
  }),
]);

const BOUNDARY_TEXT =
  'Ocurrió un error al presentar esta sección. Las demás secciones del panel no se ven afectadas.';

const LINK_CLASS =
  'inline-flex min-h-[44px] w-full items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-2)] text-left text-[length:var(--font-size-sm)] leading-[var(--line-height-tight)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none sm:w-auto';

function ReloadButton({
  onClick,
  disabled = false,
  label = 'Actualizar panel',
}) {
  return (
    <Button
      variant="secondary"
      size="small"
      onClick={onClick}
      disabled={disabled}
    >
      <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
      {label}
    </Button>
  );
}

function CohortHeader({ cohort, loadedAt, isLoading, onReload }) {
  return (
    <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-5)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-[var(--space-3)]">
        <Layers
          size={22}
          strokeWidth={1.8}
          className="shrink-0 text-[var(--brand-600)]"
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-col">
          <span className="text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--text-muted)] uppercase">
            Cohorte activa
          </span>
          <Link
            to={getCohortDetailPath(cohort.id)}
            className="text-[length:var(--font-size-lg)] leading-[var(--line-height-tight)] font-extrabold break-words text-[var(--text-primary)] no-underline hover:underline"
          >
            {cohort.name?.trim() || 'Ver cohorte'}
          </Link>
          <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">
            {loadedAt ? (
              <>
                Panel cargado el{' '}
                <time dateTime={loadedAt} className="font-bold">
                  {formatAuditTimestamp(loadedAt)}
                </time>{' '}
                (hora de Colombia)
              </>
            ) : (
              'Cargando el panel...'
            )}
          </span>
        </div>
      </div>

      <ReloadButton
        onClick={onReload}
        disabled={isLoading}
        label={isLoading ? 'Actualizando...' : 'Actualizar panel'}
      />
    </div>
  );
}

function CohortShortcuts({ cohort }) {
  return (
    <nav
      aria-labelledby="accesos-cohorte-activa"
      className="flex flex-col gap-[var(--space-2)] border-t border-[var(--surface-border)] pt-[var(--space-6)]"
    >
      <h2
        id="accesos-cohorte-activa"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Accesos de la cohorte activa
      </h2>
      <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:flex-wrap">
        <Link to={getCohortTrackingPath(cohort.id)} className={LINK_CLASS}>
          <UsersRound
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
          Seguimiento de participantes
        </Link>
        <Link to={getCohortEvolutionPath(cohort.id)} className={LINK_CLASS}>
          <TrendingUp
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
          Evolución temporal
        </Link>
        <Link to={COHORTS_PATH} className={LINK_CLASS}>
          <Layers
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
          Gestión de cohortes
        </Link>
      </div>
    </nav>
  );
}

function CohortStatusNotice({ status, activeCohorts, onReload }) {
  if (status === DASHBOARD_STATUS.ACCESS_DENIED) {
    return (
      <CohortNotice
        tone="danger"
        icon={AlertTriangle}
        title="Acceso no permitido"
        role="alert"
      >
        Tu sesión no tiene acceso al panel administrativo.
      </CohortNotice>
    );
  }

  if (
    status === DASHBOARD_STATUS.COHORTS_ERROR ||
    status === DASHBOARD_STATUS.PANEL_ERROR
  ) {
    const panelError = status === DASHBOARD_STATUS.PANEL_ERROR;
    return (
      <CohortNotice
        tone="danger"
        icon={AlertTriangle}
        title={
          panelError
            ? 'No pudimos cargar el panel'
            : 'No pudimos identificar la cohorte activa'
        }
        role="alert"
        action={<ReloadButton onClick={onReload} label="Reintentar" />}
      >
        {panelError
          ? 'El panel no respondió correctamente. Intenta cargarlo de nuevo.'
          : 'No se pudo confirmar la cohorte activa. Intenta cargar el panel de nuevo.'}
      </CohortNotice>
    );
  }

  if (status === DASHBOARD_STATUS.NO_ACTIVE_COHORT) {
    return (
      <CohortNotice
        tone="neutral"
        icon={SearchX}
        title="Sin cohorte activa"
        role="status"
        action={
          <Link to={COHORTS_PATH} className={LINK_CLASS}>
            <Layers
              size={16}
              strokeWidth={1.8}
              className="shrink-0"
              aria-hidden="true"
            />
            Ir a Cohortes
          </Link>
        }
      >
        No existe una cohorte activa en este momento. Cree o active una cohorte
        para comenzar a visualizar el panel principal.
      </CohortNotice>
    );
  }

  // Varias cohortes activas: no se elige ninguna de forma arbitraria.
  return (
    <CohortNotice
      tone="warning"
      icon={Layers}
      title={
        activeCohorts.length
          ? `Hay ${activeCohorts.length} cohortes activas`
          : 'Hay varias cohortes activas'
      }
      role="status"
      action={
        activeCohorts.length === 0 && (
          <Link to={COHORTS_PATH} className={LINK_CLASS}>
            Ir a Cohortes
          </Link>
        )
      }
    >
      <span className="flex flex-col gap-[var(--space-2)]">
        <span>
          Todavía no está definido cuál de ellas se muestra en el panel
          principal. Consulta cada una desde su detalle o revisa su estado en
          Cohortes.
        </span>
        <span className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:flex-wrap">
          {activeCohorts.map((cohort) => (
            <Link
              key={cohort.id}
              to={getCohortDetailPath(cohort.id)}
              className={LINK_CLASS}
            >
              {cohort.name?.trim() || 'Cohorte sin nombre'}
            </Link>
          ))}
        </span>
      </span>
    </CohortNotice>
  );
}

/*
 * Panel principal del módulo administrativo (RF-140): panorama agregado
 * de la cohorte activa. Orden de prioridad: alertas críticas, conducta y
 * adherencia (RF-132), progresión narrativa (RF-133) y efectividad de
 * notificaciones (RF-134). Cada sección se presenta con el componente de
 * su vista y dentro de su propio límite de error: un fallo de una no
 * derriba las demás. Nunca muestra datos individuales.
 *
 * Lo monta la pantalla de aterrizaje administrativa (app/router), por
 * encima de los indicadores y accesos ya existentes.
 */
export function CohortDashboard() {
  const {
    status,
    cohort,
    activeCohorts,
    dashboard,
    retryingSections,
    isDemo,
    reload,
    retrySection,
  } = useCohortDashboard();

  const isLoading = status === DASHBOARD_STATUS.LOADING;
  const behavioralView = dashboard?.vista_conductual?.view;
  // Desglose tal como llega de RF-132 (sin cálculo), solo con datos.
  const alertBreakdown = viewHasData(behavioralView)
    ? behavioralView.data
    : null;

  // Cada widget, en su propio límite de error y con su propio reintento.
  const renderWidget = (section) => (
    <SectionErrorBoundary
      key={section.key}
      label={section.title}
      description={BOUNDARY_TEXT}
      onRetry={() => retrySection(section.key)}
    >
      <DashboardWidget
        id={section.id}
        title={section.title}
        icon={section.icon}
        dimension={section.dimension}
        moduleLabel={section.moduleLabel}
        result={dashboard?.[section.key] ?? null}
        isLoading={!dashboard || retryingSections.includes(section.key)}
        detailPath={section.detailPath(cohort.id)}
        detailLabel={section.detailLabel}
        onRetry={() => retrySection(section.key)}
        isDemo={isDemo}
        Summary={section.Summary}
      />
    </SectionErrorBoundary>
  );
  const source = dashboard?.origen_panel;

  return (
    <section
      aria-labelledby="panel-cohorte-titulo"
      aria-busy={isLoading}
      className="flex flex-col gap-[var(--space-6)]"
    >
      <h2 id="panel-cohorte-titulo" className="sr-only">
        Panorama de la cohorte activa
      </h2>

      {isDemo && (
        <CohortNotice
          tone="warning"
          icon={FlaskConical}
          title="Datos de demostración"
          role="note"
        >
          Panorama ficticio del modo de desarrollo. No proviene de los módulos
          de seguimiento, gamificación ni notificaciones, ni del servidor.
        </CohortNotice>
      )}

      {isLoading && !cohort && (
        <>
          <p role="status" className="sr-only">
            Identificando la cohorte activa...
          </p>
          <div
            aria-hidden="true"
            className="h-[88px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
          />
        </>
      )}

      {!isLoading && status !== DASHBOARD_STATUS.READY && (
        <CohortStatusNotice
          status={status}
          activeCohorts={activeCohorts}
          onReload={reload}
        />
      )}

      {cohort && (
        <>
          <CohortHeader
            cohort={cohort}
            loadedAt={dashboard?.fecha_carga_pantalla ?? null}
            isLoading={isLoading}
            onReload={reload}
          />

          {source === PANEL_SOURCE.UNAVAILABLE ? (
            <CohortNotice
              tone="danger"
              icon={CloudOff}
              title="Panel principal no disponible"
              role="alert"
              action={<ReloadButton onClick={reload} label="Reintentar" />}
            >
              El panel principal no está disponible en este momento porque
              ninguna de las fuentes de información pudo ser consultada. Intente
              nuevamente más tarde.
            </CohortNotice>
          ) : (
            <>
              {source === PANEL_SOURCE.CACHED && (
                <CohortNotice
                  tone="warning"
                  icon={History}
                  title="Se muestra la última versión conservada"
                  role="status"
                  action={<ReloadButton onClick={reload} />}
                >
                  Ninguna de las fuentes de información pudo ser consultada. Se
                  muestran los últimos datos disponibles, marcados como
                  desactualizados.
                </CohortNotice>
              )}

              <SectionErrorBoundary
                label="Alertas críticas pendientes"
                description={BOUNDARY_TEXT}
                onRetry={reload}
              >
                <CriticalAlertsCard
                  total={dashboard?.total_alertas_criticas_pendientes ?? null}
                  inactivity={alertBreakdown?.pendingInactivityAlerts ?? null}
                  craving={alertBreakdown?.pendingCravingAlerts ?? null}
                  isStale={Boolean(dashboard?.alertas_desactualizadas)}
                  isLoading={!dashboard}
                  detailPath={getCohortAggregatePath(cohort.id)}
                />
              </SectionErrorBoundary>

              {/* Conducta y narrativa, en dos columnas solo con ancho real
                  suficiente; notificaciones, debajo y a todo el ancho. */}
              <div className="grid grid-cols-1 gap-[var(--space-5)] xl:grid-cols-2">
                {SECTIONS.slice(0, 2).map(renderWidget)}
              </div>
              {SECTIONS.slice(2).map(renderWidget)}
            </>
          )}

          <CohortShortcuts cohort={cohort} />
        </>
      )}
    </section>
  );
}
