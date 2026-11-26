import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CalendarClock,
  ChartLine,
  ClockAlert,
  CloudOff,
  FileQuestion,
  FlaskConical,
  Gauge,
  Hourglass,
  KeyRound,
  RefreshCw,
  SearchX,
  ShieldAlert,
  ShieldX,
  UserX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { ActiveAlertList } from '../../components/ActiveAlertList/index.js';
import { AlertHistorySection } from '../../components/AlertHistorySection/index.js';
import { CohortNotice } from '../../components/CohortNotice/index.js';
import { ConsumptionTrendBadge } from '../../components/ConsumptionTrendBadge/index.js';
import { NarrativeProgressSection } from '../../components/NarrativeProgressSection/index.js';
import { NotificationInteractionSection } from '../../components/NotificationInteractionSection/index.js';
import { ParticipantExportButton } from '../../components/ParticipantExportButton/index.js';
import { ParticipantSessionsLink } from '../../components/ParticipantSessionsLink/index.js';
import { ProfileIndicator } from '../../components/ProfileIndicator/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { SectionErrorBoundary } from '../../components/SectionErrorBoundary/index.js';
import { StaleBadge, StaleDataNotice } from '../../components/StaleDataNotice/index.js';
import { TemporalLocationSection } from '../../components/TemporalLocationSection/index.js';
import { isStale } from '../../services/dataFreshness.js';
import { allowsDependentSections } from '../../services/profileSectionGate.js';
import { getCohortTrackingPath, getParticipantTrackingPath } from '../../utils/cohortRoutes.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { adherenceLabel, progressLevelLabel } from '../../utils/trackingLabels.js';

import { useAlertHistory } from './hooks/useAlertHistory.js';
import { useNarrativeProgress } from './hooks/useNarrativeProgress.js';
import { useNotificationInteraction } from './hooks/useNotificationInteraction.js';
import { PROFILE_STATUS, useParticipantTrackingProfile } from './hooks/useParticipantTrackingProfile.js';
import { useTemporalLocation } from './hooks/useTemporalLocation.js';

/*
 * Ficha individual de seguimiento
 * (/cohortes/:idCohorte/seguimiento/:codigoParticipante, RF-128). Solo
 * consulta, con el código seudonimizado que entregó el listado (RF-142);
 * en la API, solo un seudónimo A7 de un miembro activo de la cohorte:
 * no ofrece crear, editar ni eliminar indicadores, alertas, progresión,
 * notificaciones, cronogramas ni pausas. Fuera de alcance: gestión o
 * resolución de alertas (RF-147). La exportación CSV individual (RF-145)
 * solo lee y se confirma en un modal antes de pedir el archivo. Incluye como secciones propias, cada
 * una con su propia autorización, sus propios errores y su propio límite
 * de error, el historial de alertas (RF-129), la progresión narrativa
 * (RF-130, M06), la interacción con notificaciones (RF-131, M07) y la
 * ubicación temporal (M04, RF-22 y RF-22B).
 *
 * Modo degradado (RF-149): cada sección muestra, junto a sus datos, la
 * advertencia de desactualización que marque el backend. La caída de
 * M05 no impide consultar las demás secciones; una denegación o un
 * problema de identidad de la ficha sí (services/profileSectionGate).
 * Las secciones de historial, narrativa, notificaciones y ubicación
 * temporal solo existen en la demostración: en la API aún no están
 * integradas y se indica sin ocultar el perfil.
 *
 * La página solo compone; el estado vive en los hooks.
 */
const RETRY_STATUSES = Object.freeze([
  PROFILE_STATUS.UNAVAILABLE,
  PROFILE_STATUS.ERROR,
  PROFILE_STATUS.INCONSISTENT,
  PROFILE_STATUS.STALE_UNDATED,
]);

// Avisos de los estados sin datos. Textos de RF-128 cuando los define.
const STATUS_NOTICE = Object.freeze({
  [PROFILE_STATUS.NO_PROFILE]: Object.freeze({
    tone: 'neutral', icon: FileQuestion, role: 'status', title: 'Sin perfil de seguimiento',
    message: 'No existe perfil de seguimiento disponible para el participante consultado.',
  }),
  [PROFILE_STATUS.DENIED]: Object.freeze({
    tone: 'warning', icon: ShieldX, role: 'alert', title: 'Acceso denegado',
    message: 'No tiene permisos para consultar perfiles de seguimiento individuales.',
  }),
  [PROFILE_STATUS.INVALID_CODE]: Object.freeze({
    tone: 'neutral', icon: KeyRound, role: 'alert', title: 'Identificador no válido',
    message: 'El identificador del participante no es válido. Abre la ficha desde el seguimiento de la cohorte.',
  }),
  [PROFILE_STATUS.NOT_FOUND]: Object.freeze({
    tone: 'neutral', icon: SearchX, role: 'alert', title: 'Participante no encontrado',
    message: 'El participante seleccionado no existe.',
  }),
  [PROFILE_STATUS.COHORT_NOT_FOUND]: Object.freeze({
    tone: 'neutral', icon: SearchX, role: 'alert', title: 'Cohorte no encontrada',
    message: 'La cohorte solicitada no existe en el sistema.',
  }),
  [PROFILE_STATUS.OUTSIDE_COHORT]: Object.freeze({
    tone: 'neutral', icon: UserX, role: 'alert', title: 'Participante fuera de la cohorte',
    message: 'El participante no es un miembro activo de esta cohorte. Su información de seguimiento no se muestra aquí.',
  }),
  [PROFILE_STATUS.INCONSISTENT]: Object.freeze({
    tone: 'danger', icon: ShieldAlert, role: 'alert', title: 'Información no mostrada',
    message: 'La información de seguimiento no corresponde al participante solicitado. Por seguridad no se muestra.',
  }),
  [PROFILE_STATUS.UNAVAILABLE]: Object.freeze({
    tone: 'warning', icon: CloudOff, role: 'alert', title: 'Módulo no disponible',
    message: 'El módulo de seguimiento no se encuentra disponible en este momento. No hay datos anteriores disponibles para mostrar; las demás secciones se consultan por separado.',
  }),
  [PROFILE_STATUS.STALE_UNDATED]: Object.freeze({
    tone: 'warning', icon: ClockAlert, role: 'alert', title: 'Datos desactualizados sin fecha confiable',
    message: 'El módulo de seguimiento no responde en tiempo real y la fecha del último dato disponible no es confiable. Por seguridad no se muestran datos desactualizados.',
  }),
  [PROFILE_STATUS.ERROR]: Object.freeze({
    tone: 'danger', icon: AlertTriangle, role: 'alert', title: 'Ficha no disponible',
    message: 'No fue posible cargar el perfil de seguimiento individual.',
  }),
});

const unitsLabel = (value) =>
  value === null ? null : `${value} ${value === 1 ? 'unidad completada' : 'unidades completadas'}`;

const daysLabel = (value) => (value === null ? null : `${value} ${value === 1 ? 'día con registro' : 'días con registro'}`);

// La ficha de cada participante se monta de nuevo al cambiar la ruta, para
// que ningún dato de una ficha anterior quede visible ni un instante.
export function ParticipantTrackingProfilePage() {
  const { idCohorte, codigoParticipante } = useParams();
  const cohortId = idCohorte ?? null;
  const participantCode = codigoParticipante ?? null;

  return (
    <ParticipantTrackingProfile
      key={`${cohortId}|${participantCode}`}
      cohortId={cohortId}
      participantCode={participantCode}
    />
  );
}

function ParticipantTrackingProfile({ cohortId, participantCode }) {
  const { cohort, code, profile, status, freshness, isLoading, isDemo, headingRef, retry } =
    useParticipantTrackingProfile({ cohortId, participantCode });

  const cohortName = cohort?.name?.trim();
  const notice = !isLoading ? STATUS_NOTICE[status] : null;
  const showProfile = !isLoading && status === PROFILE_STATUS.READY && profile;
  const updatedLabel = showProfile ? formatAuditTimestamp(profile.updatedAt) : null;
  const participantConfirmed = !isLoading && (status === PROFILE_STATUS.READY || status === PROFILE_STATUS.NO_PROFILE);
  const showCode = participantConfirmed && code;
  // RF-38 y RF-145: el código confirmado por la API real (perfil o 204,
  // tras comprobar la pertenencia a la cohorte) es auténtico; nunca el de
  // la demostración.
  const authenticCode = participantConfirmed && !isDemo;
  // RF-149: la ficha degradada se muestra con su advertencia.
  const profileStale = participantConfirmed && isStale(freshness);
  // Las secciones dependientes solo existen en la demostración, y se
  // consultan salvo denegación o problema de identidad.
  const sectionsEnabled = isDemo && allowsDependentSections({ status, isLoading });
  const sectionsPending = !isDemo && participantConfirmed;
  const reference = participantCode;
  const history = useAlertHistory({
    cohortId,
    reference,
    enabled: sectionsEnabled,
    activeAlerts: showProfile ? profile.activeAlerts : null,
  });
  // Cada sección con su propia autorización explícita.
  const narrative = useNarrativeProgress({ cohortId, reference, enabled: sectionsEnabled });
  const notifications = useNotificationInteraction({ cohortId, reference, enabled: sectionsEnabled });
  const temporal = useTemporalLocation({ cohortId, reference, enabled: sectionsEnabled });

  if (status === PROFILE_STATUS.SESSION_REQUIRED) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
      <Link
        to={cohortId ? getCohortTrackingPath(cohortId) : '/app/administrativo/cohortes'}
        className="-ml-[var(--space-2)] inline-flex min-h-[44px] w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-bold text-[var(--brand-600)] no-underline transition-colors duration-150 hover:bg-[var(--surface-hover)] motion-reduce:transition-none"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
        Volver al seguimiento
      </Link>

      <header className="flex flex-col gap-[var(--space-2)]">
        <p className="m-0 text-[length:var(--font-size-xs)] font-bold tracking-[var(--letter-spacing-wide)] text-[var(--brand-600)] uppercase">
          Administración · Cohortes · Seguimiento
        </p>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="m-0 text-[length:var(--font-size-2xl)] leading-[var(--line-height-tight)] font-extrabold tracking-[var(--letter-spacing-tight)] [overflow-wrap:anywhere] text-[var(--text-primary)] md:text-[length:var(--font-size-3xl)]"
        >
          Ficha de seguimiento
          {showCode && (
            <>
              <span className="sr-only"> del participante</span>
              <span className="block font-[family-name:var(--font-mono)] text-[length:var(--font-size-xl)] text-[var(--text-secondary)] md:text-[length:var(--font-size-2xl)]">
                {code}
              </span>
            </>
          )}
        </h1>

        <p className="m-0 max-w-[680px] text-[length:var(--font-size-md)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          {cohortName ? <>Cohorte «{cohortName}».</> : 'Cohorte del participante.'} Indicadores principales
          que expone el módulo de seguimiento.
        </p>
      </header>

      <ParticipantSessionsLink
        participantCode={code}
        authentic={authenticCode}
        returnTo={cohortId && code ? getParticipantTrackingPath(cohortId, code) : null}
      />

      {participantConfirmed && (
        <ParticipantExportButton key={authenticCode ? code : 'sin-codigo'} participantCode={code} authentic={authenticCode} />
      )}

      <ReadOnlyNotice>
        Consulta de solo lectura: los indicadores, las alertas, su historial,
        la progresión narrativa y la interacción con notificaciones provienen
        de los módulos de seguimiento, gamificación y notificaciones, y no
        pueden modificarse desde aquí. Solo se muestra el código
        seudonimizado del participante.
      </ReadOnlyNotice>

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Datos de demostración" role="note">
          Ficha ficticia del modo de desarrollo. No representa datos reales de
          seguimiento ni se calcula a partir de la elegibilidad de la cohorte.
          Las negativas de acceso también son simuladas.
        </CohortNotice>
      )}

      {isLoading && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-4)]">
          <p role="status" className="sr-only">
            Cargando la ficha de seguimiento...
          </p>
          <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-[140px] animate-pulse rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      )}

      {notice && (
        <CohortNotice
          tone={notice.tone}
          icon={notice.icon}
          title={notice.title}
          role={notice.role}
          action={
            RETRY_STATUSES.includes(status) ? (
              <Button variant="secondary" onClick={retry}>
                <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                Reintentar
              </Button>
            ) : null
          }
        >
          {notice.message}
          {status === PROFILE_STATUS.DENIED && isDemo &&
            ' Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.'}
        </CohortNotice>
      )}

      {profileStale && <StaleDataNotice moduleLabel="seguimiento" lastAvailableAt={freshness.lastAvailableAt} />}

      {showProfile && (
        <>
          <section aria-labelledby="indicadores-principales" className="flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)]">
              <h2 id="indicadores-principales" className="m-0 inline-flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
                Indicadores principales
                {profileStale && <StaleBadge />}
              </h2>
              <p className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[var(--text-muted)]">
                <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" />
                {updatedLabel ? (
                  <span>
                    Actualizado el <time dateTime={profile.updatedAt}>{updatedLabel}</time>
                    <span className="sr-only"> (hora de Colombia)</span>
                  </span>
                ) : (
                  <span>Fecha de actualización no disponible</span>
                )}
              </p>
            </div>

            <dl className="m-0 grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3">
              <ProfileIndicator
                icon={Gauge}
                label="Nivel de progreso"
                value={profile.progressLevel === null ? null : progressLevelLabel(profile.progressLevel)}
                detail={unitsLabel(profile.completedUnits)}
                description="Categoría reportada por el módulo de seguimiento."
              />
              <ProfileIndicator
                icon={Activity}
                label="Tasa de adherencia"
                value={profile.adherence === null ? null : adherenceLabel(profile.adherence)}
                detail={daysLabel(profile.daysWithRecord)}
                description="Reportada por el módulo de seguimiento."
              />
              <div className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
                <dt className="inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
                  <ChartLine size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
                  Tendencia de consumo
                </dt>
                <dd className="m-0">
                  <ConsumptionTrendBadge trend={profile.trend} />
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="alertas-activas" className="flex flex-col gap-[var(--space-3)]">
            <h2 id="alertas-activas" className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
              <BellRing size={20} strokeWidth={1.8} aria-hidden="true" />
              Alertas activas
              {Array.isArray(profile.activeAlerts) && (
                <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
                  ({profile.activeAlerts.length})
                </span>
              )}
              {profileStale && <StaleBadge />}
            </h2>
            <ActiveAlertList alerts={profile.activeAlerts} />
          </section>
        </>
      )}

      {sectionsPending && (
        <CohortNotice tone="info" icon={Hourglass} title="Otras secciones aún no disponibles" role="note">
          El historial de alertas, la progresión narrativa, la interacción con
          notificaciones y la ubicación temporal todavía no están disponibles
          en esta ficha.
        </CohortNotice>
      )}

      {sectionsEnabled && (
        <SectionErrorBoundary label="Historial de alertas">
          <AlertHistorySection
            alerts={history.alerts}
            status={history.status}
            freshness={history.freshness}
            isLoading={history.isLoading}
            hasSummaryMismatch={history.hasSummaryMismatch}
            isDemo={isDemo}
            retry={history.retry}
          />
        </SectionErrorBoundary>
      )}

      {sectionsEnabled && (
        <SectionErrorBoundary label="Progresión narrativa">
          <NarrativeProgressSection
            narrative={narrative.narrative}
            status={narrative.status}
            freshness={narrative.freshness}
            isLoading={narrative.isLoading}
            isDemo={isDemo}
            retry={narrative.retry}
          />
        </SectionErrorBoundary>
      )}

      {sectionsEnabled && (
        <SectionErrorBoundary label="Interacción con notificaciones">
          <NotificationInteractionSection
            interaction={notifications.interaction}
            status={notifications.status}
            freshness={notifications.freshness}
            isLoading={notifications.isLoading}
            isDemo={isDemo}
            retry={notifications.retry}
          />
        </SectionErrorBoundary>
      )}

      {sectionsEnabled && (
        <SectionErrorBoundary label="Ubicación temporal en el programa">
          <TemporalLocationSection
            temporal={temporal.temporal}
            status={temporal.status}
            freshness={temporal.freshness}
            isLoading={temporal.isLoading}
            isDemo={isDemo}
            retry={temporal.retry}
          />
        </SectionErrorBoundary>
      )}
    </div>
  );
}
