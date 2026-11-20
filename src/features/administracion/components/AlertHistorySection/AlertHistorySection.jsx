import {
  AlertTriangle,
  ClockAlert,
  CloudOff,
  GitCompareArrows,
  History,
  Inbox,
  RefreshCw,
  SearchX,
  ShieldAlert,
  ShieldX,
  UserX,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { isStale } from '../../services/dataFreshness.js';
import { ALERT_HISTORY_STATUS } from '../../types/participantTracking.js';
import { AlertHistoryList } from '../AlertHistoryList/index.js';
import { CohortNotice } from '../CohortNotice/index.js';
import { StaleBadge, StaleDataNotice } from '../StaleDataNotice/index.js';

/*
 * Sección «Historial de alertas» de la ficha (RF-129). Solo presenta el
 * estado que recibe de useAlertHistory: su propio cargando, vacío,
 * denegado y errores, sin afectar a los indicadores de la ficha. Textos
 * de RF-129 cuando los define. No ofrece acciones de escritura.
 */
const STATUS = ALERT_HISTORY_STATUS;

const RETRY_STATUSES = Object.freeze([STATUS.UNAVAILABLE, STATUS.ERROR, STATUS.INCONSISTENT, STATUS.STALE_UNDATED]);

const STATUS_NOTICE = Object.freeze({
  [STATUS.EMPTY]: Object.freeze({
    tone: 'neutral', icon: Inbox, role: 'status', title: 'Sin alertas registradas',
    message: 'El participante no cuenta con alertas registradas.',
  }),
  [STATUS.DENIED]: Object.freeze({
    tone: 'warning', icon: ShieldX, role: 'alert', title: 'Acceso denegado al historial',
    message: 'No tiene permisos para consultar el historial de alertas del participante.',
  }),
  [STATUS.NOT_FOUND]: Object.freeze({
    tone: 'neutral', icon: SearchX, role: 'alert', title: 'Participante no encontrado',
    message: 'El participante seleccionado no existe.',
  }),
  [STATUS.COHORT_NOT_FOUND]: Object.freeze({
    tone: 'neutral', icon: SearchX, role: 'alert', title: 'Cohorte no encontrada',
    message: 'La cohorte solicitada no existe en el sistema.',
  }),
  [STATUS.OUTSIDE_COHORT]: Object.freeze({
    tone: 'neutral', icon: UserX, role: 'alert', title: 'Participante fuera de la cohorte',
    message: 'El participante ya no pertenece a esta cohorte. Su historial de alertas no se muestra aquí.',
  }),
  [STATUS.INCONSISTENT]: Object.freeze({
    tone: 'danger', icon: ShieldAlert, role: 'alert', title: 'Historial no mostrado',
    message: 'El historial de alertas contiene información no asociada al participante solicitado. Por seguridad no se muestra ningún registro.',
  }),
  [STATUS.UNAVAILABLE]: Object.freeze({
    tone: 'warning', icon: CloudOff, role: 'alert', title: 'Módulo no disponible',
    message: 'El módulo de seguimiento no se encuentra disponible en este momento. No hay datos anteriores disponibles para mostrar; las demás secciones se consultan por separado.',
  }),
  [STATUS.STALE_UNDATED]: Object.freeze({
    tone: 'warning', icon: ClockAlert, role: 'alert', title: 'Datos desactualizados sin fecha confiable',
    message: 'El módulo de seguimiento no responde en tiempo real y la fecha del último dato disponible no es confiable. Por seguridad no se muestran datos desactualizados.',
  }),
  [STATUS.ERROR]: Object.freeze({
    tone: 'danger', icon: AlertTriangle, role: 'alert', title: 'Historial no disponible',
    message: 'No fue posible cargar el historial de alertas del participante.',
  }),
});

export function AlertHistorySection({ alerts, status, freshness, isLoading, hasSummaryMismatch, isDemo, retry }) {
  const notice = !isLoading ? STATUS_NOTICE[status] : null;
  const stale = !isLoading && (status === STATUS.READY || status === STATUS.EMPTY) && isStale(freshness);
  const showList = !isLoading && status === STATUS.READY && Array.isArray(alerts) && alerts.length > 0;

  return (
    <section aria-labelledby="historial-alertas" className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-1)]">
        <h2 id="historial-alertas" className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
          <History size={20} strokeWidth={1.8} aria-hidden="true" />
          Historial de alertas
          {stale && <StaleBadge />}
          {showList && (
            <span className="text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
              ({alerts.length})
            </span>
          )}
        </h2>
        <p className="m-0 max-w-[680px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Alertas de craving elevado e inactividad registradas por el módulo de
          seguimiento, de la más antigua a la más reciente, con su estado de
          resolución. Solo las que figuran como «Activa» forman parte del
          resumen de alertas activas.
        </p>
      </div>

      {stale && <StaleDataNotice moduleLabel="seguimiento" lastAvailableAt={freshness.lastAvailableAt} />}

      {isLoading && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-3)]">
          <p role="status" className="sr-only">
            Cargando el historial de alertas...
          </p>
          {[0, 1].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-[88px] animate-pulse rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] motion-reduce:animate-none"
            />
          ))}
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
                Reintentar historial
              </Button>
            ) : null
          }
        >
          {notice.message}
          {status === STATUS.DENIED && isDemo &&
            ' Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.'}
        </CohortNotice>
      )}

      {!isLoading && hasSummaryMismatch && (
        <CohortNotice tone="info" icon={GitCompareArrows} title="El resumen y el historial no coinciden" role="note">
          Las alertas activas del resumen y las que figuran como «Activa» en el
          historial son distintas. Pueden provenir de consultas actualizadas en
          momentos diferentes; ninguna se corrige desde aquí.
        </CohortNotice>
      )}

      {showList && <AlertHistoryList alerts={alerts} />}
    </section>
  );
}
