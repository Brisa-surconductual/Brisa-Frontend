import {
  AlertTriangle,
  BellOff,
  ClockAlert,
  CloudOff,
  EyeOff,
  Hourglass,
  Info,
  Lock,
  MailCheck,
  MailOpen,
  MousePointerClick,
  RefreshCw,
  SearchX,
  Send,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import {
  AGGREGATE_VIEW_STATUS,
  AGGREGATION_STATE,
} from '../../types/behavioralAggregate.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { AggregateMetric } from '../AggregateMetric/index.js';
import { CohortNotice } from '../CohortNotice/index.js';
import { StaleDataNotice } from '../StaleDataNotice/index.js';

/*
 * Vista agregada de efectividad de notificaciones de una cohorte (RF-134,
 * datos de M07 vía RF-101). Solo presenta lo que recibe: primero las
 * tasas promedio de apertura y conversión, después los totales de
 * notificaciones enviadas, entregadas y descartadas.
 *
 * Las tasas se muestran como la proporción que entrega M07 (RF-100), sin
 * convertirlas a porcentaje ni redondearlas. Los totales no se suman,
 * restan ni comparan. Una tasa no calculable (null) es «No disponible»,
 * nunca 0. Nunca muestra historial, contenido ni tipo de mensajes de un
 * participante, ni enlaza a fichas individuales.
 */

// Textos de RF-134 cuando la fuente no envía `mensaje`.
const DEFAULT_TEXT = Object.freeze({
  NOT_CONSOLIDATED:
    'La cohorte todavía no cuenta con métricas de efectividad de notificaciones consolidadas. La vista se mostrará cuando existan envíos registrados en la cohorte.',
  UNAVAILABLE:
    'El módulo de notificaciones no está disponible en este momento y no hay una vista de efectividad anterior para mostrar.',
  SUPPRESSED:
    'El módulo de notificaciones no entrega las métricas agregadas de esta cohorte para proteger la privacidad de sus participantes.',
  ERROR:
    'No fue posible consultar las métricas de efectividad de notificaciones de la cohorte en este momento. Intenta nuevamente más tarde.',
});

const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});
// Sin redondear ni convertir: la tasa se muestra con los decimales que trae.
const RATE_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 20,
});

function RetryButton({ onRetry }) {
  return (
    <Button variant="secondary" onClick={onRetry}>
      <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
      Reintentar
    </Button>
  );
}

function GroupTitle({ children }) {
  return (
    <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
      {children}
    </h3>
  );
}

function StaleNotice({ lastAvailableAt }) {
  if (lastAvailableAt) {
    return (
      <StaleDataNotice
        moduleLabel="notificaciones"
        lastAvailableAt={lastAvailableAt}
      />
    );
  }

  return (
    <CohortNotice
      tone="warning"
      icon={ClockAlert}
      title="Datos desactualizados"
      role="status"
    >
      El módulo de notificaciones no está disponible. Se muestra la última vista
      de efectividad que entregó, sin fecha informada.
    </CohortNotice>
  );
}

function NotificationData({
  data,
  updatedAt,
  aggregationState,
  sourceNote,
  isDemo,
}) {
  return (
    <>
      {aggregationState === AGGREGATION_STATE.UPDATE_ERROR && (
        <CohortNotice
          tone="warning"
          icon={AlertTriangle}
          title="Última actualización incompleta"
          role="note"
        >
          El módulo de notificaciones informa que la última actualización de la
          vista no se completó. Se muestran los valores que entregó.
        </CohortNotice>
      )}

      {aggregationState === AGGREGATION_STATE.PENDING && (
        <CohortNotice
          tone="neutral"
          icon={Hourglass}
          title="Actualización pendiente"
          role="note"
        >
          El módulo de notificaciones tiene una actualización pendiente. Se
          muestran los valores que entregó.
        </CohortNotice>
      )}

      {/* Aviso de M07 sobre los datos (p. ej. usuarios sin métricas
          calculables excluidos del promedio): informa, no bloquea. */}
      {sourceNote && (
        <CohortNotice
          tone="info"
          icon={Info}
          title="Aviso del módulo de notificaciones"
          role="note"
        >
          {sourceNote}
        </CohortNotice>
      )}

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Tasas promedio</GroupTitle>
        <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
          <AggregateMetric
            label="Tasa de apertura promedio"
            icon={MailOpen}
            value={data.averageOpenRate}
            format={RATE_FORMAT}
            description="Proporción entre notificaciones abiertas y entregadas, tal como la entrega el módulo de notificaciones."
          />
          <AggregateMetric
            label="Tasa de conversión promedio"
            icon={MousePointerClick}
            value={data.averageConversionRate}
            format={RATE_FORMAT}
            description="Proporción entre sesiones iniciadas desde una notificación y notificaciones abiertas, tal como la entrega el módulo de notificaciones."
          />
        </dl>
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Notificaciones de la cohorte</GroupTitle>
        <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-3">
          <AggregateMetric
            label="Enviadas"
            icon={Send}
            value={data.sentNotifications}
            format={COUNT_FORMAT}
          />
          <AggregateMetric
            label="Entregadas"
            icon={MailCheck}
            value={data.deliveredNotifications}
            format={COUNT_FORMAT}
          />
          <AggregateMetric
            label="Descartadas"
            icon={BellOff}
            value={data.discardedNotifications}
            format={COUNT_FORMAT}
          />
        </dl>
      </div>

      <p className="m-0 inline-flex items-start gap-[var(--space-2)] text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-muted)]">
        <Lock
          size={14}
          strokeWidth={2}
          className="mt-[2px] shrink-0"
          aria-hidden="true"
        />
        <span>
          Datos agregados de la cohorte: no identifican a ningún participante ni
          muestran el contenido de los mensajes.{' '}
          {updatedAt ? (
            <>
              Actualizado el{' '}
              <time dateTime={updatedAt} className="font-bold">
                {formatAuditTimestamp(updatedAt)}
              </time>{' '}
              (hora de Colombia
              {isDemo ? '; fecha ficticia de la demostración' : ''}).
            </>
          ) : (
            'Fecha de actualización no disponible.'
          )}
        </span>
      </p>
    </>
  );
}

export function NotificationAggregateView({ view, isDemo, onRetry }) {
  const status = view?.status;
  const message = view?.message;
  // RF-101 define `fecha_actualizacion`; el contrato de referencia la
  // entrega como `ultimo_timestamp_disponible` en la envoltura.
  const updatedAt = view?.data?.updatedAt ?? view?.lastAvailableAt ?? null;

  switch (status) {
    case AGGREGATE_VIEW_STATUS.READY:
      return (
        <NotificationData
          data={view.data}
          updatedAt={updatedAt}
          aggregationState={view.aggregationState}
          sourceNote={message}
          isDemo={isDemo}
        />
      );

    case AGGREGATE_VIEW_STATUS.STALE:
      return (
        <>
          <StaleNotice lastAvailableAt={view.lastAvailableAt} />
          <NotificationData
            data={view.data}
            updatedAt={updatedAt}
            isDemo={isDemo}
          />
        </>
      );

    case AGGREGATE_VIEW_STATUS.NOT_CONSOLIDATED:
      return (
        <CohortNotice
          tone="neutral"
          icon={Hourglass}
          title="Métricas aún no consolidadas"
          role="status"
        >
          {message ?? DEFAULT_TEXT.NOT_CONSOLIDATED}
        </CohortNotice>
      );

    case AGGREGATE_VIEW_STATUS.SUPPRESSED:
      return (
        <CohortNotice
          tone="neutral"
          icon={EyeOff}
          title="Vista no mostrada por privacidad"
          role="status"
        >
          {message ?? DEFAULT_TEXT.SUPPRESSED}
        </CohortNotice>
      );

    case AGGREGATE_VIEW_STATUS.UNAVAILABLE:
      return (
        <CohortNotice
          tone="warning"
          icon={CloudOff}
          title="Vista de notificaciones no disponible"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          {DEFAULT_TEXT.UNAVAILABLE}
        </CohortNotice>
      );

    case AGGREGATE_VIEW_STATUS.INCONSISTENT:
      return (
        <CohortNotice
          tone="danger"
          icon={ShieldAlert}
          title="Vista no mostrada"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          La información recibida no corresponde a la cohorte solicitada. Por
          seguridad no se muestra.
        </CohortNotice>
      );

    case AGGREGATE_VIEW_STATUS.NOT_FOUND:
      return (
        <CohortNotice
          tone="neutral"
          icon={SearchX}
          title="Cohorte no encontrada"
          role="alert"
        >
          La cohorte solicitada no existe en el sistema.
        </CohortNotice>
      );

    default:
      return (
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title="No pudimos cargar la vista de notificaciones"
          role="alert"
          action={<RetryButton onRetry={onRetry} />}
        >
          {DEFAULT_TEXT.ERROR}
        </CohortNotice>
      );
  }
}
