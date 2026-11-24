import {
  AlertTriangle,
  Award,
  ClockAlert,
  GraduationCap,
  Hourglass,
  Info,
  Lock,
  Trophy,
  UsersRound,
} from 'lucide-react';

import {
  AGGREGATE_VIEW_STATUS,
  AGGREGATION_STATE,
} from '../../types/behavioralAggregate.js';
import { NARRATIVE_PHASE } from '../../types/narrativeAggregate.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { AggregateMetric } from '../AggregateMetric/index.js';
import { AggregateViewNotice } from '../AggregateViewNotice/AggregateViewNotice.jsx';
import { CohortNotice } from '../CohortNotice/index.js';
import { StaleDataNotice } from '../StaleDataNotice/index.js';

/*
 * Vista agregada de progresión narrativa y gamificación de una cohorte
 * (RF-133, datos de M06 vía RF-117). Solo presenta lo que recibe: primero
 * la distribución por fase narrativa y después graduación y logros.
 *
 * No suma las fases, no calcula porcentajes ni las compara con el total
 * de la cohorte. Nunca muestra perfiles, capítulos ni logros de un
 * participante, ni enlaza a fichas individuales.
 */

// Textos de RF-133 cuando la fuente no envía `mensaje`.
const DEFAULT_TEXT = Object.freeze({
  pendingTitle: 'Progresión narrativa aún no consolidada',
  unavailableTitle: 'Vista narrativa no disponible',
  errorTitle: 'No pudimos cargar la vista narrativa',
  NOT_CONSOLIDATED:
    'La cohorte todavía no cuenta con progresión narrativa consolidada. La vista se mostrará cuando existan perfiles narrativos activos en la cohorte.',
  UNAVAILABLE:
    'El módulo de gamificación no está disponible en este momento y no hay una vista narrativa anterior para mostrar.',
  SUPPRESSED:
    'El módulo de gamificación no entrega la progresión narrativa agregada de esta cohorte para proteger la privacidad de sus participantes.',
  ERROR:
    'No fue posible consultar la progresión narrativa agregada de la cohorte en este momento. Intenta nuevamente más tarde.',
});

const PHASE_LABEL = Object.freeze({
  [NARRATIVE_PHASE.START]: 'Inicio',
  [NARRATIVE_PHASE.DEVELOPMENT]: 'Desarrollo',
  [NARRATIVE_PHASE.CLOSING]: 'Cierre',
});

const COUNT_FORMAT = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

function GroupTitle({ children }) {
  return (
    <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
      {children}
    </h3>
  );
}

function PhaseDistribution({ distribution }) {
  if (!distribution) {
    return (
      <CohortNotice
        tone="neutral"
        icon={Info}
        title="Distribución no disponible"
        role="note"
      >
        La distribución por fase narrativa no llegó en un formato válido. No se
        muestra de forma parcial.
      </CohortNotice>
    );
  }

  return (
    <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-3">
      {distribution.map(({ phase, users }) => (
        <AggregateMetric
          key={phase}
          label={PHASE_LABEL[phase]}
          value={users}
          format={COUNT_FORMAT}
          description="Usuarios en esta fase"
        />
      ))}
    </dl>
  );
}

function StaleNotice({ lastAvailableAt }) {
  if (lastAvailableAt) {
    return (
      <StaleDataNotice
        moduleLabel="gamificación"
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
      El módulo de gamificación no está disponible. Se muestra la última vista
      narrativa que entregó, sin fecha informada.
    </CohortNotice>
  );
}

function NarrativeData({
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
          El módulo de gamificación informa que la última actualización de la
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
          El módulo de gamificación tiene una actualización pendiente. Se
          muestran los valores que entregó.
        </CohortNotice>
      )}

      {/* Aviso de M06 sobre los datos (p. ej. usuarios sin perfil narrativo
          excluidos): informa, no bloquea los agregados disponibles. */}
      {sourceNote && (
        <CohortNotice
          tone="info"
          icon={Info}
          title="Aviso del módulo de gamificación"
          role="note"
        >
          {sourceNote}
        </CohortNotice>
      )}

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Distribución por fase narrativa</GroupTitle>
        {data.cohortUsers !== null && (
          <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-3">
            <AggregateMetric
              label="Usuarios de la cohorte"
              icon={UsersRound}
              value={data.cohortUsers}
              format={COUNT_FORMAT}
            />
          </dl>
        )}
        <PhaseDistribution distribution={data.phaseDistribution} />
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <GroupTitle>Graduación y logros</GroupTitle>
        <dl className="m-0 grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-3">
          <AggregateMetric
            label="Programa completado"
            icon={GraduationCap}
            value={data.completedProgramUsers}
            format={COUNT_FORMAT}
            description="Usuarios con graduación simbólica"
          />
          <AggregateMetric
            label="Usuarios con logros"
            icon={Award}
            value={data.usersWithAchievements}
            format={COUNT_FORMAT}
            description="Con al menos un logro narrativo"
          />
          <AggregateMetric
            label="Logros desbloqueados"
            icon={Trophy}
            value={data.unlockedAchievements}
            format={COUNT_FORMAT}
            description="Total de la cohorte"
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
          muestran su progreso narrativo individual.{' '}
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

export function NarrativeAggregateView({ view, isDemo, onRetry }) {
  const status = view?.status;
  const message = view?.message;
  // RF-117 define `fecha_actualizacion`; el contrato de referencia la
  // entrega como `ultimo_timestamp_disponible` en la envoltura.
  const updatedAt = view?.data?.updatedAt ?? view?.lastAvailableAt ?? null;

  switch (status) {
    case AGGREGATE_VIEW_STATUS.READY:
      return (
        <NarrativeData
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
          <NarrativeData
            data={view.data}
            updatedAt={updatedAt}
            isDemo={isDemo}
          />
        </>
      );

    default:
      return <AggregateViewNotice view={view} copy={DEFAULT_TEXT} onRetry={onRetry} />;
  }
}
