import {
  AlertTriangle,
  ClockAlert,
  CloudOff,
  EyeOff,
  Hourglass,
  Info,
  Lock,
  MoonStar,
  RefreshCw,
  SearchX,
  ShieldAlert,
  UsersRound,
  Waves,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import {
  AGGREGATE_VIEW_STATUS,
  AGGREGATION_STATE,
  PROGRESS_LEVEL,
} from '../../types/behavioralAggregate.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { AggregateMetric } from '../AggregateMetric/index.js';
import { CohortNotice } from '../CohortNotice/index.js';
import { StaleDataNotice } from '../StaleDataNotice/index.js';

/*
 * Vista agregada conductual de una cohorte (RF-132, datos de M05 conforme
 * a RF-78). Solo presenta lo que recibe y en el orden que pide la
 * usabilidad de RF-132: primero las alertas pendientes, después
 * participación y adherencia, y la distribución por nivel de progreso.
 *
 * No suma las alertas, no calcula porcentajes de la distribución ni
 * convierte la adherencia (su escala no está definida). Nunca muestra
 * datos de un participante ni enlaza a fichas individuales.
 */

// Textos de RF-132 cuando la fuente no envía `mensaje`.
const DEFAULT_TEXT = Object.freeze({
  NOT_CONSOLIDATED:
    'La cohorte todavía no cuenta con indicadores consolidados. La vista se mostrará cuando el módulo de seguimiento complete su primer ciclo de consolidación.',
  UNAVAILABLE:
    'El módulo de seguimiento no está disponible en este momento y no hay una vista anterior para mostrar.',
  SUPPRESSED:
    'El módulo de seguimiento no entrega los indicadores agregados de esta cohorte para proteger la privacidad de sus participantes.',
});

const LEVEL_LABEL = Object.freeze({
  [PROGRESS_LEVEL.INITIAL]: 'Inicial',
  [PROGRESS_LEVEL.IN_PROGRESS]: 'En avance',
  [PROGRESS_LEVEL.ADVANCED]: 'Avanzado',
  [PROGRESS_LEVEL.COMPLETED]: 'Completado',
});

const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});
// Sin redondear: la adherencia se muestra con los decimales que trae.
const RATE_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 20,
});

const hasPending = (value) => Number.isInteger(value) && value > 0;

function RetryButton({ onRetry, label }) {
  return (
    <Button variant="secondary" onClick={onRetry}>
      <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
      {label}
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

function ProgressDistribution({ distribution }) {
  if (!distribution) {
    return (
      <CohortNotice
        tone="neutral"
        icon={Info}
        title="Distribución no disponible"
        role="note"
      >
        La distribución por nivel de progreso no llegó en un formato válido. No
        se muestra de forma parcial.
      </CohortNotice>
    );
  }

  return (
    <dl className="m-0 grid grid-cols-2 gap-[var(--space-3)] sm:grid-cols-4">
      {distribution.map(({ level, users }) => (
        <AggregateMetric
          key={level}
          label={LEVEL_LABEL[level]}
          value={users}
          format={COUNT_FORMAT}
        />
      ))}
    </dl>
  );
}

function StaleNotice({ lastAvailableAt }) {
  if (lastAvailableAt) {
    return (
      <StaleDataNotice
        moduleLabel="seguimiento"
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
      El módulo de seguimiento no está disponible. Se muestra la última vista
      agregada que entregó, sin fecha informada.
    </CohortNotice>
  );
}

function AggregateData({ data, aggregationState, isDemo }) {
  return (
    <>
      {aggregationState === AGGREGATION_STATE.UPDATE_ERROR && (
        <CohortNotice
          tone="warning"
          icon={AlertTriangle}
          title="Última actualización incompleta"
          role="note"
        >
          El módulo de seguimiento informa que la última actualización de la
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
          El módulo de seguimiento tiene una actualización pendiente. Se
          muestran los valores que entregó.
        </CohortNotice>
      )}

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Alertas pendientes</GroupTitle>
        <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
          <AggregateMetric
            label="Alertas de inactividad"
            icon={MoonStar}
            value={data.pendingInactivityAlerts}
            format={COUNT_FORMAT}
            emphasis={hasPending(data.pendingInactivityAlerts)}
          />
          <AggregateMetric
            label="Alertas de craving elevado"
            icon={Waves}
            value={data.pendingCravingAlerts}
            format={COUNT_FORMAT}
            emphasis={hasPending(data.pendingCravingAlerts)}
          />
        </dl>
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Participación y adherencia</GroupTitle>
        <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
          <AggregateMetric
            label="Participantes activos"
            icon={UsersRound}
            value={data.activeUsers}
            format={COUNT_FORMAT}
          />
          <AggregateMetric
            label="Adherencia promedio"
            value={data.averageAdherence}
            format={RATE_FORMAT}
            description="Valor tal como lo entrega el módulo de seguimiento; su escala aún no está definida."
          />
        </dl>
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Distribución por nivel de progreso</GroupTitle>
        <ProgressDistribution distribution={data.progressDistribution} />
      </div>

      <p className="m-0 inline-flex items-start gap-[var(--space-2)] text-[length:var(--font-size-xs)] leading-[var(--line-height-normal)] text-[var(--text-muted)]">
        <Lock
          size={14}
          strokeWidth={2}
          className="mt-[2px] shrink-0"
          aria-hidden="true"
        />
        <span>
          Datos agregados de la cohorte: no identifican a ningún participante.{' '}
          {data.updatedAt ? (
            <>
              Actualizado el{' '}
              <time dateTime={data.updatedAt} className="font-bold">
                {formatAuditTimestamp(data.updatedAt)}
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

export function BehavioralAggregateView({ view, isDemo, onRetry }) {
  const status = view?.status;
  const message = view?.message;

  switch (status) {
    case AGGREGATE_VIEW_STATUS.READY:
      return (
        <AggregateData
          data={view.data}
          aggregationState={view.aggregationState}
          isDemo={isDemo}
        />
      );

    case AGGREGATE_VIEW_STATUS.STALE:
      return (
        <>
          <StaleNotice lastAvailableAt={view.lastAvailableAt} />
          <AggregateData data={view.data} isDemo={isDemo} />
        </>
      );

    case AGGREGATE_VIEW_STATUS.NOT_CONSOLIDATED:
      return (
        <CohortNotice
          tone="neutral"
          icon={Hourglass}
          title="Indicadores aún no consolidados"
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
          title="Vista agregada no disponible"
          role="alert"
          action={<RetryButton onRetry={onRetry} label="Reintentar" />}
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
          action={<RetryButton onRetry={onRetry} label="Reintentar" />}
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
          title="Vista agregada no disponible"
          role="alert"
          action={<RetryButton onRetry={onRetry} label="Reintentar" />}
        >
          No pudimos cargar la vista agregada de la cohorte. Intenta nuevamente.
        </CohortNotice>
      );
  }
}
