import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CalendarClock,
  ChartLine,
  CloudOff,
  FileQuestion,
  FlaskConical,
  Gauge,
  PlugZap,
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
import { ProfileIndicator } from '../../components/ProfileIndicator/index.js';
import { ReadOnlyNotice } from '../../components/ReadOnlyNotice/index.js';
import { getCohortTrackingPath } from '../../utils/cohortRoutes.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';

import { useAlertHistory } from './hooks/useAlertHistory.js';
import { useNarrativeProgress } from './hooks/useNarrativeProgress.js';
import { useNotificationInteraction } from './hooks/useNotificationInteraction.js';
import { PROFILE_STATUS, useParticipantTrackingProfile } from './hooks/useParticipantTrackingProfile.js';

/*
 * Ficha individual de seguimiento
 * (/cohortes/:idCohorte/seguimiento/:referencia, RF-128). Solo consulta:
 * no ofrece crear, editar ni eliminar indicadores, alertas, progresión
 * ni notificaciones. Fuera de alcance: gestión o resolución de alertas
 * (RF-147), modo degradado (RF-149) y cronograma (M04). Incluye como
 * secciones propias, cada una con su propia autorización y sus propios
 * errores, el historial de alertas (RF-129), la progresión narrativa
 * (RF-130, M06) y la interacción con notificaciones (RF-131, M07); solo
 * se consultan cuando la ficha confirmó el acceso al participante.
 * La página solo compone; el estado vive en los hooks.
 */
const RETRY_STATUSES = Object.freeze([PROFILE_STATUS.UNAVAILABLE, PROFILE_STATUS.ERROR, PROFILE_STATUS.INCONSISTENT]);

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
    message: 'El participante ya no pertenece a esta cohorte. Su información de seguimiento no se muestra aquí.',
  }),
  [PROFILE_STATUS.INCONSISTENT]: Object.freeze({
    tone: 'danger', icon: ShieldAlert, role: 'alert', title: 'Información no mostrada',
    message: 'La información de seguimiento no corresponde al participante solicitado. Por seguridad no se muestra.',
  }),
  [PROFILE_STATUS.UNAVAILABLE]: Object.freeze({
    tone: 'warning', icon: CloudOff, role: 'alert', title: 'Módulo no disponible',
    message: 'El módulo de seguimiento no se encuentra disponible en este momento.',
  }),
  [PROFILE_STATUS.ERROR]: Object.freeze({
    tone: 'danger', icon: AlertTriangle, role: 'alert', title: 'Ficha no disponible',
    message: 'No fue posible cargar el perfil de seguimiento individual.',
  }),
});

// La ficha de cada participante se monta de nuevo al cambiar la ruta, para
// que ningún dato de una ficha anterior quede visible ni un instante.
export function ParticipantTrackingProfilePage() {
  const { idCohorte, referencia } = useParams();
  const cohortId = idCohorte ?? null;
  const reference = referencia ?? null;

  return <ParticipantTrackingProfile key={`${cohortId}|${reference}`}cohortId={cohortId} reference={reference} />;
}

function ParticipantTrackingProfile({ cohortId, reference }) {
  const { cohort, code, profile, status, isLoading, isDemo, isIntegrationPending, headingRef, retry } =
    useParticipantTrackingProfile({ cohortId, reference });

  const cohortName = cohort?.name?.trim();
  const notice = !isLoading ? STATUS_NOTICE[status] : null;
  const showProfile = !isLoading && status === PROFILE_STATUS.READY && profile;
  const updatedLabel = showProfile ? formatAuditTimestamp(profile.updatedAt) : null;
  // El historial solo se consulta cuando la ficha confirmó el acceso al participante.
  const participantConfirmed = !isLoading && (status === PROFILE_STATUS.READY || status === PROFILE_STATUS.NO_PROFILE);
  const showCode = participantConfirmed && code;
  const history = useAlertHistory({
    cohortId,
    reference,
    enabled: participantConfirmed,
    activeAlerts: showProfile ? profile.activeAlerts : null,
  });
  // M06 y M07: misma condición, cada una con su propia autorización.
  const narrative = useNarrativeProgress({ cohortId, reference, enabled: participantConfirmed });
  const notifications = useNotificationInteraction({ cohortId, reference, enabled: participantConfirmed });

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

      {!isIntegrationPending && (
        <ReadOnlyNotice>
          Consulta de solo lectura: los indicadores, las alertas, su historial,
          la progresión narrativa y la interacción con notificaciones provienen
          de los módulos de seguimiento, gamificación y notificaciones, y no
          pueden modificarse desde aquí. Solo se muestra el código
          seudonimizado del participante.
        </ReadOnlyNotice>
      )}

      {isDemo && (
        <CohortNotice tone="warning" icon={FlaskConical} title="Datos de demostración" role="note">
          Ficha ficticia del modo de desarrollo. No representa datos reales de
          seguimiento ni se calcula a partir de la elegibilidad de la cohorte.
          La autorización mostrada también es simulada.
        </CohortNotice>
      )}

      {isIntegrationPending && (
        <CohortNotice tone="info" icon={PlugZap} title="Integración pendiente" role="status">
          La consulta del perfil de seguimiento individual todavía no está
          conectada al servidor. No se muestra ningún dato del participante.
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

      {showProfile && (
        <>
          <section aria-labelledby="indicadores-principales" className="flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-2)]">
              <h2 id="indicadores-principales" className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
                Indicadores principales
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
                label="Progreso"
                description="Valor principal reportado por el módulo de seguimiento."
                indicator={profile.progress}
              />
              <ProfileIndicator
                icon={Activity}
                label="Adherencia"
                description="Valor principal reportado por el módulo de seguimiento."
                indicator={profile.adherence}
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
            </h2>
            <ActiveAlertList alerts={profile.activeAlerts} />
          </section>
        </>
      )}

      {participantConfirmed && (
        <AlertHistorySection
          alerts={history.alerts}
          status={history.status}
          isLoading={history.isLoading}
          hasSummaryMismatch={history.hasSummaryMismatch}
          isDemo={isDemo}
          retry={history.retry}
        />
      )}

      {participantConfirmed && (
        <NarrativeProgressSection
          narrative={narrative.narrative}
          status={narrative.status}
          isLoading={narrative.isLoading}
          isDemo={isDemo}
          retry={narrative.retry}
        />
      )}

      {participantConfirmed && (
        <NotificationInteractionSection
          interaction={notifications.interaction}
          status={notifications.status}
          isLoading={notifications.isLoading}
          isDemo={isDemo}
          retry={notifications.retry}
        />
      )}
    </div>
  );
}
