import { CalendarRange, CircleCheck, CircleHelp, CirclePause, CircleSlash, Flag, Hourglass, Route } from 'lucide-react';

import { isStale } from '../../services/dataFreshness.js';
import { SECTION_STATUS } from '../../types/participantEngagement.js';
import { PAUSE_STATUS } from '../../types/temporalLocation.js';
import { formatAuditTimestamp } from '../../utils/formatAuditTimestamp.js';
import { formatElapsedTime } from '../../utils/formatElapsedTime.js';
import { staleUndatedMessage } from '../../utils/staleSectionMessage.js';
import { ProfileSectionStatus } from '../ProfileSectionStatus/index.js';
import { StaleBadge, StaleDataNotice } from '../StaleDataNotice/index.js';

/*
 * Sección «Ubicación temporal en el programa» de la ficha (M04). Solo
 * presenta lo que recibe, con fundamento en RF-22 (unidad temporal
 * vigente, tiempo efectivo transcurrido, cronograma finalizado) y RF-22B
 * (pausas administrativas: estado y fechas). No calcula nada, no muestra
 * el motivo de las pausas ni identificadores, y no ofrece acciones sobre
 * cronogramas, asignaciones ni pausas. Ningún requerimiento del M08 fija
 * los textos de error de esta consulta: son de la interfaz.
 */
const MESSAGES = Object.freeze({
  [SECTION_STATUS.EMPTY]: Object.freeze({
    title: 'Sin cronograma asignado',
    message: 'El módulo de cronograma no tiene información temporal para el participante consultado.',
  }),
  [SECTION_STATUS.DENIED]: Object.freeze({
    title: 'Acceso restringido a la ubicación temporal',
    message: 'No tiene permisos para consultar la ubicación temporal del participante.',
  }),
  [SECTION_STATUS.PERMISSION_REQUIRED]: Object.freeze({
    title: 'Acceso restringido a la ubicación temporal',
    message: 'No tiene permisos para consultar la ubicación temporal del participante.',
  }),
  [SECTION_STATUS.INCONSISTENT]: Object.freeze({
    title: 'Ubicación temporal no mostrada',
    message: 'La información temporal retornada no corresponde al participante solicitado. Por seguridad no se muestra.',
  }),
  [SECTION_STATUS.UNAVAILABLE]: Object.freeze({
    title: 'Módulo no disponible',
    message: 'El módulo de cronograma no se encuentra disponible en este momento. Las demás secciones se consultan por separado.',
  }),
  [SECTION_STATUS.STALE_UNDATED]: staleUndatedMessage('cronograma'),
  [SECTION_STATUS.ERROR]: Object.freeze({
    title: 'Ubicación temporal no disponible',
    message: 'No fue posible cargar la ubicación temporal del participante.',
  }),
});

const PAUSE_PRESENTATION = Object.freeze({
  [PAUSE_STATUS.ACTIVE]: Object.freeze({
    label: 'Activa', Icon: CirclePause,
    className: 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
  }),
  [PAUSE_STATUS.FINISHED]: Object.freeze({
    label: 'Finalizada', Icon: CircleCheck,
    className: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  }),
  [PAUSE_STATUS.CANCELLED]: Object.freeze({
    label: 'Anulada', Icon: CircleSlash,
    className: 'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  }),
});

const NEUTRAL = 'border-[var(--surface-border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]';
const NOT_AVAILABLE = 'No disponible';

function finishedLabel(value) {
  if (value === true) return 'Cronograma finalizado';
  if (value === false) return 'En curso';

  return null;
}

function Field({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
      <dt className="inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
        <Icon size={18} strokeWidth={1.8} className="shrink-0 text-[var(--brand-600)]" aria-hidden="true" />
        {label}
      </dt>
      <dd className="m-0 flex flex-col gap-[var(--space-1)]">
        <span
          className={`[overflow-wrap:anywhere] ${value ? 'text-[length:var(--font-size-lg)] font-bold text-[var(--text-primary)]' : 'text-[length:var(--font-size-md)] font-semibold text-[var(--text-secondary)]'}`}
        >
          {value ?? NOT_AVAILABLE}
        </span>
        {hint && <span className="text-[length:var(--font-size-xs)] text-[var(--text-muted)]">{hint}</span>}
      </dd>
    </div>
  );
}

function PauseDate({ value }) {
  const label = formatAuditTimestamp(value);

  return label ? <time dateTime={value}>{label}</time> : 'fecha no disponible';
}

function Pauses({ pauses }) {
  if (pauses === null) {
    return (
      <p className="m-0 inline-flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-secondary)]">
        <CircleHelp size={18} strokeWidth={1.8} aria-hidden="true" />
        No disponible
      </p>
    );
  }

  if (pauses.length === 0) {
    return (
      <p className="m-0 inline-flex w-fit items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-sm)] font-bold text-[var(--text-secondary)]">
        <CalendarRange size={16} strokeWidth={2} aria-hidden="true" />
        Sin pausas administrativas registradas
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
      {pauses.map((pause, index) => {
        const presentation = PAUSE_PRESENTATION[pause.status];
        const Icon = presentation?.Icon ?? CircleHelp;

        return (
          <li
            key={`${index}-${pause.startsAt}`}
            className="flex flex-wrap items-center justify-between gap-x-[var(--space-3)] gap-y-[var(--space-1)] rounded-[var(--radius-lg)] border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--text-primary)]"
          >
            <span className="tabular-nums">
              Del <PauseDate value={pause.startsAt} /> al <PauseDate value={pause.endsAt} />
            </span>
            <span
              className={`inline-flex w-fit max-w-full items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-[2px] text-[length:var(--font-size-xs)] font-bold [overflow-wrap:anywhere] ${presentation?.className ?? NEUTRAL}`}
            >
              <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="sr-only">Estado de la pausa: </span>
              {presentation?.label ?? (pause.status ? 'Estado no reconocido' : 'Estado no disponible')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function TemporalLocationSection({ temporal, status, freshness, isLoading, isDemo, retry }) {
  const showData = !isLoading && status === SECTION_STATUS.READY && temporal;
  const stale = !isLoading && (status === SECTION_STATUS.READY || status === SECTION_STATUS.EMPTY) && isStale(freshness);

  return (
    <section aria-labelledby="ubicacion-temporal" className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-1)]">
        <h2 id="ubicacion-temporal" className="m-0 inline-flex flex-wrap items-center gap-[var(--space-2)] text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]">
          <Route size={20} strokeWidth={1.8} aria-hidden="true" />
          Ubicación temporal en el programa
          {stale && <StaleBadge />}
        </h2>
        <p className="m-0 max-w-[680px] text-[length:var(--font-size-sm)] leading-[var(--line-height-normal)] text-[var(--text-secondary)]">
          Información expuesta por el módulo de cronograma. La unidad vigente y el
          tiempo transcurrido los calcula ese módulo; no se modifican desde aquí.
        </p>
      </div>

      {stale && <StaleDataNotice moduleLabel="cronograma" lastAvailableAt={freshness.lastAvailableAt} />}

      <ProfileSectionStatus
        status={status}
        isLoading={isLoading}
        messages={MESSAGES}
        loadingLabel="Cargando la ubicación temporal..."
        retryLabel="Reintentar ubicación temporal"
        retry={retry}
        isDemo={isDemo}
      />

      {showData && (
        <>
          <dl className="m-0 grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3">
            <Field icon={Flag} label="Unidad temporal vigente" value={temporal.currentUnitName} />
            <Field
              icon={Hourglass}
              label="Tiempo efectivo transcurrido"
              value={formatElapsedTime(temporal.effectiveElapsedSeconds)}
              hint="Descontadas las pausas, según el módulo de cronograma."
            />
            <Field icon={CalendarRange} label="Estado del cronograma" value={finishedLabel(temporal.programFinished)} />
          </dl>

          <div className="flex flex-col gap-[var(--space-2)]">
            <h3 className="m-0 text-[length:var(--font-size-md)] font-bold text-[var(--text-primary)]">
              Pausas administrativas
              {Array.isArray(temporal.pauses) && (
                <span className="ml-[var(--space-2)] text-[length:var(--font-size-sm)] font-semibold text-[var(--text-muted)]">
                  ({temporal.pauses.length})
                </span>
              )}
            </h3>
            <Pauses pauses={temporal.pauses} />
          </div>
        </>
      )}
    </section>
  );
}
